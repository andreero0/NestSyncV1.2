"""
WebSocket Service for NestSync
Real-time order tracking and subscription updates
"""

import logging
import json
import asyncio
from typing import Dict, Any, Set, Optional, List
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from enum import Enum

import websockets
from websockets.server import WebSocketServerProtocol
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models import (
    User, ReorderSubscription, ReorderTransaction, OrderStatusUpdate,
    ConsumptionPrediction, OrderStatus
)
from app.config.settings import settings

logger = logging.getLogger(__name__)


class WebSocketMessageType(str, Enum):
    """WebSocket message types"""
    # Authentication
    AUTHENTICATE = "authenticate"
    AUTHENTICATED = "authenticated"
    AUTH_ERROR = "auth_error"

    # Subscriptions
    SUBSCRIBE_ORDER_UPDATES = "subscribe_order_updates"
    SUBSCRIBE_PREDICTION_UPDATES = "subscribe_prediction_updates"
    SUBSCRIBE_BILLING_EVENTS = "subscribe_billing_events"
    UNSUBSCRIBE = "unsubscribe"

    # Real-time updates
    ORDER_STATUS_UPDATE = "order_status_update"
    PREDICTION_UPDATE = "prediction_update"
    BILLING_EVENT = "billing_event"

    # System
    PING = "ping"
    PONG = "pong"
    ERROR = "error"


@dataclass
class WebSocketMessage:
    """WebSocket message structure"""
    type: WebSocketMessageType
    data: Dict[str, Any]
    timestamp: str = None
    user_id: str = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now(timezone.utc).isoformat()

    def to_json(self) -> str:
        """Convert message to JSON string"""
        return json.dumps(asdict(self))

    @classmethod
    def from_json(cls, message: str) -> 'WebSocketMessage':
        """Create message from JSON string"""
        data = json.loads(message)
        return cls(**data)


@dataclass
class WebSocketConnection:
    """WebSocket connection information"""
    websocket: WebSocketServerProtocol
    user_id: str
    subscriptions: Set[str]
    authenticated: bool
    connected_at: datetime
    last_ping: datetime

    def __post_init__(self):
        if not self.connected_at:
            self.connected_at = datetime.now(timezone.utc)
        if not self.last_ping:
            self.last_ping = datetime.now(timezone.utc)


class WebSocketService:
    """
    Service for managing WebSocket connections and real-time updates
    """

    def __init__(self):
        self.connections: Dict[str, WebSocketConnection] = {}
        self.user_connections: Dict[str, Set[str]] = {}  # user_id -> connection_ids
        self.running = False

    async def start_server(self, host: str = "0.0.0.0", port: int = 8002):
        """
        Start WebSocket server for real-time updates
        """
        self.running = True
        logger.info(f"Starting WebSocket server on {host}:{port}")

        # Start periodic cleanup task
        cleanup_task = asyncio.create_task(self._periodic_cleanup())

        try:
            async with websockets.serve(self._handle_connection, host, port):
                logger.info("WebSocket server started successfully")
                await asyncio.Future()  # Run forever
        except Exception as e:
            logger.error(f"WebSocket server error: {e}")
        finally:
            self.running = False
            cleanup_task.cancel()

    async def stop_server(self):
        """
        Stop WebSocket server
        """
        self.running = False

        # Close all connections
        for connection in list(self.connections.values()):
            await self._disconnect_client(connection)

        logger.info("WebSocket server stopped")

    async def _handle_connection(self, websocket: WebSocketServerProtocol, path: str):
        """
        Handle new WebSocket connection
        """
        connection_id = id(websocket)
        logger.info(f"New WebSocket connection: {connection_id}")

        connection = WebSocketConnection(
            websocket=websocket,
            user_id="",
            subscriptions=set(),
            authenticated=False,
            connected_at=datetime.now(timezone.utc),
            last_ping=datetime.now(timezone.utc)
        )

        self.connections[connection_id] = connection

        try:
            await self._send_message(connection, WebSocketMessage(
                type=WebSocketMessageType.PING,
                data={"message": "Welcome to NestSync real-time updates"}
            ))

            async for raw_message in websocket:
                try:
                    message = WebSocketMessage.from_json(raw_message)
                    await self._handle_message(connection, message)
                except json.JSONDecodeError:
                    await self._send_error(connection, "Invalid JSON format")
                except Exception as e:
                    logger.error(f"Error handling message: {e}")
                    await self._send_error(connection, "Message processing error")

        except websockets.exceptions.ConnectionClosed:
            logger.info(f"WebSocket connection closed: {connection_id}")
        except Exception as e:
            logger.error(f"WebSocket connection error: {e}")
        finally:
            await self._disconnect_client(connection)

    async def _handle_message(self, connection: WebSocketConnection, message: WebSocketMessage):
        """
        Handle incoming WebSocket message
        """
        message_type = message.type

        if message_type == WebSocketMessageType.AUTHENTICATE:
            await self._handle_authentication(connection, message)
        elif message_type == WebSocketMessageType.PING:
            await self._handle_ping(connection, message)
        elif not connection.authenticated:
            await self._send_error(connection, "Authentication required")
        elif message_type == WebSocketMessageType.SUBSCRIBE_ORDER_UPDATES:
            await self._handle_subscribe_orders(connection, message)
        elif message_type == WebSocketMessageType.SUBSCRIBE_PREDICTION_UPDATES:
            await self._handle_subscribe_predictions(connection, message)
        elif message_type == WebSocketMessageType.SUBSCRIBE_BILLING_EVENTS:
            await self._handle_subscribe_billing(connection, message)
        elif message_type == WebSocketMessageType.UNSUBSCRIBE:
            await self._handle_unsubscribe(connection, message)
        else:
            await self._send_error(connection, f"Unknown message type: {message_type}")

    async def _handle_authentication(self, connection: WebSocketConnection, message: WebSocketMessage):
        """
        Handle user authentication
        """
        try:
            # Extract token from message
            token = message.data.get('token')
            if not token:
                await self._send_error(connection, "Authentication token required")
                return

            # Validate token and get user
            user_id = await self._validate_auth_token(token)
            if not user_id:
                await self._send_error(connection, "Invalid authentication token")
                return

            # Update connection
            connection.user_id = user_id
            connection.authenticated = True

            # Add to user connections
            if user_id not in self.user_connections:
                self.user_connections[user_id] = set()
            self.user_connections[user_id].add(str(id(connection.websocket)))

            # Send authentication success
            await self._send_message(connection, WebSocketMessage(
                type=WebSocketMessageType.AUTHENTICATED,
                data={
                    "user_id": user_id,
                    "message": "Authentication successful"
                },
                user_id=user_id
            ))

            logger.info(f"User {user_id} authenticated via WebSocket")

        except Exception as e:
            logger.error(f"Authentication error: {e}")
            await self._send_error(connection, "Authentication failed")

    async def _handle_ping(self, connection: WebSocketConnection, message: WebSocketMessage):
        """
        Handle ping message
        """
        connection.last_ping = datetime.now(timezone.utc)
        await self._send_message(connection, WebSocketMessage(
            type=WebSocketMessageType.PONG,
            data={"timestamp": connection.last_ping.isoformat()},
            user_id=connection.user_id
        ))

    async def _handle_subscribe_orders(self, connection: WebSocketConnection, message: WebSocketMessage):
        """
        Handle order updates subscription
        """
        subscription_key = f"orders:{connection.user_id}"
        connection.subscriptions.add(subscription_key)

        await self._send_message(connection, WebSocketMessage(
            type=WebSocketMessageType.SUBSCRIBE_ORDER_UPDATES,
            data={
                "subscribed": True,
                "subscription": "order_updates",
                "user_id": connection.user_id
            },
            user_id=connection.user_id
        ))

        logger.info(f"User {connection.user_id} subscribed to order updates")

    async def _handle_subscribe_predictions(self, connection: WebSocketConnection, message: WebSocketMessage):
        """
        Handle prediction updates subscription
        """
        subscription_key = f"predictions:{connection.user_id}"
        connection.subscriptions.add(subscription_key)

        await self._send_message(connection, WebSocketMessage(
            type=WebSocketMessageType.SUBSCRIBE_PREDICTION_UPDATES,
            data={
                "subscribed": True,
                "subscription": "prediction_updates",
                "user_id": connection.user_id
            },
            user_id=connection.user_id
        ))

        logger.info(f"User {connection.user_id} subscribed to prediction updates")

    async def _handle_subscribe_billing(self, connection: WebSocketConnection, message: WebSocketMessage):
        """
        Handle billing events subscription
        """
        subscription_key = f"billing:{connection.user_id}"
        connection.subscriptions.add(subscription_key)

        await self._send_message(connection, WebSocketMessage(
            type=WebSocketMessageType.SUBSCRIBE_BILLING_EVENTS,
            data={
                "subscribed": True,
                "subscription": "billing_events",
                "user_id": connection.user_id
            },
            user_id=connection.user_id
        ))

        logger.info(f"User {connection.user_id} subscribed to billing events")

    async def _handle_unsubscribe(self, connection: WebSocketConnection, message: WebSocketMessage):
        """
        Handle unsubscribe request
        """
        subscription_type = message.data.get('subscription')
        if subscription_type:
            subscription_key = f"{subscription_type}:{connection.user_id}"
            connection.subscriptions.discard(subscription_key)

            await self._send_message(connection, WebSocketMessage(
                type=WebSocketMessageType.UNSUBSCRIBE,
                data={
                    "unsubscribed": True,
                    "subscription": subscription_type
                },
                user_id=connection.user_id
            ))

    async def _send_message(self, connection: WebSocketConnection, message: WebSocketMessage):
        """
        Send message to WebSocket connection
        """
        try:
            await connection.websocket.send(message.to_json())
        except websockets.exceptions.ConnectionClosed:
            await self._disconnect_client(connection)
        except Exception as e:
            logger.error(f"Error sending WebSocket message: {e}")

    async def _send_error(self, connection: WebSocketConnection, error_message: str):
        """
        Send error message to WebSocket connection
        """
        error_msg = WebSocketMessage(
            type=WebSocketMessageType.ERROR,
            data={"error": error_message},
            user_id=connection.user_id
        )
        await self._send_message(connection, error_msg)

    async def _disconnect_client(self, connection: WebSocketConnection):
        """
        Disconnect WebSocket client and cleanup
        """
        connection_id = str(id(connection.websocket))

        # Remove from connections
        if connection_id in self.connections:
            del self.connections[connection_id]

        # Remove from user connections
        if connection.user_id and connection.user_id in self.user_connections:
            self.user_connections[connection.user_id].discard(connection_id)
            if not self.user_connections[connection.user_id]:
                del self.user_connections[connection.user_id]

        try:
            await connection.websocket.close()
        except:
            pass

        logger.info(f"Disconnected WebSocket client: {connection_id}")

    async def _validate_auth_token(self, token: str) -> Optional[str]:
        """
        Validate authentication token and return user ID
        """
        try:
            # This would integrate with your existing auth system
            # For now, we'll simulate token validation

            # In production, this would:
            # 1. Decode JWT token
            # 2. Validate signature
            # 3. Check expiration
            # 4. Return user ID

            # Placeholder implementation
            if token.startswith("valid_token_"):
                return token.replace("valid_token_", "")

            return None

        except Exception as e:
            logger.error(f"Token validation error: {e}")
            return None

    async def _periodic_cleanup(self):
        """
        Periodic cleanup of stale connections
        """
        while self.running:
            try:
                await asyncio.sleep(60)  # Run every minute

                current_time = datetime.now(timezone.utc)
                stale_connections = []

                for connection_id, connection in self.connections.items():
                    # Check if connection is stale (no ping for 5 minutes)
                    time_since_ping = current_time - connection.last_ping
                    if time_since_ping.total_seconds() > 300:  # 5 minutes
                        stale_connections.append(connection)

                # Disconnect stale connections
                for connection in stale_connections:
                    logger.info(f"Cleaning up stale WebSocket connection: {connection.user_id}")
                    await self._disconnect_client(connection)

            except Exception as e:
                logger.error(f"Error in periodic cleanup: {e}")

    # =============================================================================
    # Public API Methods for Broadcasting Updates
    # =============================================================================

    async def broadcast_order_update(self, user_id: str, order_update: OrderStatusUpdate):
        """
        Broadcast order status update to subscribed users
        """
        if not self.running:
            return

        subscription_key = f"orders:{user_id}"
        await self._broadcast_to_subscription(subscription_key, WebSocketMessage(
            type=WebSocketMessageType.ORDER_STATUS_UPDATE,
            data={
                "order_id": order_update.transaction_id,
                "previous_status": order_update.previous_status.value if order_update.previous_status else None,
                "new_status": order_update.new_status.value,
                "status_message": order_update.status_message,
                "tracking_number": order_update.tracking_number,
                "tracking_url": order_update.tracking_url,
                "estimated_delivery": order_update.estimated_delivery.isoformat() if order_update.estimated_delivery else None,
                "timestamp": order_update.created_at.isoformat()
            },
            user_id=user_id
        ))

    async def broadcast_prediction_update(self, user_id: str, prediction: ConsumptionPrediction):
        """
        Broadcast consumption prediction update to subscribed users
        """
        if not self.running:
            return

        subscription_key = f"predictions:{user_id}"
        await self._broadcast_to_subscription(subscription_key, WebSocketMessage(
            type=WebSocketMessageType.PREDICTION_UPDATE,
            data={
                "child_id": prediction.child_id,
                "prediction_id": prediction.id,
                "confidence_level": prediction.confidence_level.value,
                "predicted_runout_date": prediction.predicted_runout_date.isoformat(),
                "recommended_reorder_date": prediction.recommended_reorder_date.isoformat(),
                "current_consumption_rate": float(prediction.current_consumption_rate),
                "predicted_consumption_30d": prediction.predicted_consumption_30d,
                "size_change_probability": float(prediction.size_change_probability) if prediction.size_change_probability else None,
                "predicted_new_size": prediction.predicted_new_size,
                "timestamp": prediction.created_at.isoformat()
            },
            user_id=user_id
        ))

    async def broadcast_billing_event(self, user_id: str, event_type: str, event_data: Dict[str, Any]):
        """
        Broadcast billing event to subscribed users
        """
        if not self.running:
            return

        subscription_key = f"billing:{user_id}"
        await self._broadcast_to_subscription(subscription_key, WebSocketMessage(
            type=WebSocketMessageType.BILLING_EVENT,
            data={
                "event_type": event_type,
                "event_data": event_data,
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            user_id=user_id
        ))

    async def _broadcast_to_subscription(self, subscription_key: str, message: WebSocketMessage):
        """
        Broadcast message to all connections with specific subscription
        """
        disconnected_connections = []

        for connection in self.connections.values():
            if subscription_key in connection.subscriptions:
                try:
                    await self._send_message(connection, message)
                except:
                    disconnected_connections.append(connection)

        # Clean up disconnected connections
        for connection in disconnected_connections:
            await self._disconnect_client(connection)

    async def get_connection_stats(self) -> Dict[str, Any]:
        """
        Get WebSocket connection statistics
        """
        return {
            "total_connections": len(self.connections),
            "authenticated_connections": sum(1 for c in self.connections.values() if c.authenticated),
            "unique_users": len(self.user_connections),
            "subscription_counts": {
                "orders": sum(1 for c in self.connections.values() if any("orders:" in s for s in c.subscriptions)),
                "predictions": sum(1 for c in self.connections.values() if any("predictions:" in s for s in c.subscriptions)),
                "billing": sum(1 for c in self.connections.values() if any("billing:" in s for s in c.subscriptions))
            },
            "server_running": self.running
        }


# =============================================================================
# Global WebSocket Service Instance
# =============================================================================

# Global instance for use across the application
websocket_service = WebSocketService()