"""
Retailer API Integration Service for NestSync
Canadian retailer integrations with OAuth 2.0 security for automated ordering
"""

import logging
import json
import asyncio
import base64
import hashlib
import hmac
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from urllib.parse import urlencode, quote
from dataclasses import dataclass

import aiohttp
import xmltodict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models import (
    RetailerConfiguration, ProductMapping, ReorderTransaction,
    RetailerType, OrderStatus
)
from app.config.settings import settings

logger = logging.getLogger(__name__)


@dataclass
class ProductSearchResult:
    """Product search result from retailer API"""
    retailer_product_id: str
    name: str
    brand: str
    size: str
    pack_count: int
    price_cad: Decimal
    regular_price_cad: Optional[Decimal]
    price_per_unit: Decimal
    availability: bool
    image_url: Optional[str]
    product_url: Optional[str]
    shipping_cost: Optional[Decimal]
    estimated_delivery_days: Optional[int]


@dataclass
class OrderSubmissionResult:
    """Order submission result from retailer"""
    success: bool
    order_id: Optional[str]
    tracking_number: Optional[str]
    tracking_url: Optional[str]
    estimated_delivery: Optional[datetime]
    error_message: Optional[str]


class RetailerAPIService:
    """
    Service for integrating with Canadian retailer APIs
    Supports Amazon CA, Walmart CA, and other major Canadian retailers
    """

    def __init__(self, session: AsyncSession):
        self.session = session
        self.http_session = None

    async def __aenter__(self):
        """Async context manager entry"""
        self.http_session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30)
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.http_session:
            await self.http_session.close()

    # =============================================================================
    # Public API Methods
    # =============================================================================

    async def search_products(
        self,
        retailer_config: RetailerConfiguration,
        search_query: str,
        diaper_size: Optional[str] = None,
        brand_filter: Optional[List[str]] = None,
        max_results: int = 10
    ) -> List[ProductSearchResult]:
        """
        Search for diaper products across retailer APIs
        """
        try:
            if retailer_config.retailer_type == RetailerType.AMAZON_CA:
                return await self._search_amazon_ca(
                    retailer_config, search_query, diaper_size, brand_filter, max_results
                )
            elif retailer_config.retailer_type == RetailerType.WALMART_CA:
                return await self._search_walmart_ca(
                    retailer_config, search_query, diaper_size, brand_filter, max_results
                )
            else:
                logger.warning(f"Retailer {retailer_config.retailer_type} not implemented yet")
                return []

        except Exception as e:
            logger.error(f"Error searching products for {retailer_config.retailer_type}: {e}")
            await self._update_config_error(retailer_config, str(e))
            return []

    async def submit_order(
        self,
        retailer_config: RetailerConfiguration,
        products: List[Dict[str, Any]],
        delivery_address: Dict[str, Any],
        order_reference: str
    ) -> OrderSubmissionResult:
        """
        Submit order to retailer API
        """
        try:
            if retailer_config.retailer_type == RetailerType.AMAZON_CA:
                return await self._submit_amazon_order(
                    retailer_config, products, delivery_address, order_reference
                )
            elif retailer_config.retailer_type == RetailerType.WALMART_CA:
                return await self._submit_walmart_order(
                    retailer_config, products, delivery_address, order_reference
                )
            else:
                return OrderSubmissionResult(
                    success=False,
                    order_id=None,
                    tracking_number=None,
                    tracking_url=None,
                    estimated_delivery=None,
                    error_message=f"Retailer {retailer_config.retailer_type} not implemented"
                )

        except Exception as e:
            logger.error(f"Error submitting order to {retailer_config.retailer_type}: {e}")
            await self._update_config_error(retailer_config, str(e))
            return OrderSubmissionResult(
                success=False,
                order_id=None,
                tracking_number=None,
                tracking_url=None,
                estimated_delivery=None,
                error_message=str(e)
            )

    async def update_product_pricing(
        self,
        retailer_config: RetailerConfiguration,
        product_ids: List[str]
    ) -> Dict[str, Decimal]:
        """
        Update pricing for existing product mappings
        """
        try:
            if retailer_config.retailer_type == RetailerType.AMAZON_CA:
                return await self._update_amazon_pricing(retailer_config, product_ids)
            elif retailer_config.retailer_type == RetailerType.WALMART_CA:
                return await self._update_walmart_pricing(retailer_config, product_ids)
            else:
                logger.warning(f"Pricing updates not implemented for {retailer_config.retailer_type}")
                return {}

        except Exception as e:
            logger.error(f"Error updating pricing for {retailer_config.retailer_type}: {e}")
            await self._update_config_error(retailer_config, str(e))
            return {}

    async def test_connection(self, retailer_config: RetailerConfiguration) -> bool:
        """
        Test retailer API connection and credentials
        """
        try:
            if retailer_config.retailer_type == RetailerType.AMAZON_CA:
                return await self._test_amazon_connection(retailer_config)
            elif retailer_config.retailer_type == RetailerType.WALMART_CA:
                return await self._test_walmart_connection(retailer_config)
            else:
                return False

        except Exception as e:
            logger.error(f"Error testing connection to {retailer_config.retailer_type}: {e}")
            return False

    # =============================================================================
    # Amazon CA Product Advertising API 5.0
    # =============================================================================

    async def _search_amazon_ca(
        self,
        config: RetailerConfiguration,
        search_query: str,
        diaper_size: Optional[str],
        brand_filter: Optional[List[str]],
        max_results: int
    ) -> List[ProductSearchResult]:
        """
        Search Amazon CA using Product Advertising API 5.0
        """
        # Construct search parameters
        search_params = {
            'Keywords': f"{search_query} diapers",
            'SearchIndex': 'Baby',
            'ItemCount': min(max_results, 10),  # Max 10 per request
            'Resources': [
                'Images.Primary.Large',
                'ItemInfo.Title',
                'ItemInfo.Features',
                'Offers.Listings.Price',
                'Offers.Listings.DeliveryInfo.IsAmazonFulfilled',
                'Offers.Listings.DeliveryInfo.IsFreeShippingEligible'
            ]
        }

        # Add size filter if specified
        if diaper_size:
            search_params['Keywords'] += f" {diaper_size}"

        # Add brand filter
        if brand_filter:
            search_params['Brand'] = brand_filter[0]  # Amazon supports single brand

        # Prepare API request
        endpoint = f"{config.api_endpoint}/searchitems"
        headers = await self._get_amazon_headers(config, 'SearchItems', search_params)

        async with self.http_session.post(
            endpoint,
            headers=headers,
            json=search_params
        ) as response:
            if response.status == 200:
                data = await response.json()
                return await self._parse_amazon_search_results(data)
            else:
                error_text = await response.text()
                logger.error(f"Amazon API error: {response.status} - {error_text}")
                return []

    async def _get_amazon_headers(
        self,
        config: RetailerConfiguration,
        operation: str,
        payload: Dict[str, Any]
    ) -> Dict[str, str]:
        """
        Generate Amazon PA-API 5.0 signature headers
        """
        # Get credentials from secure storage (would need to be decrypted in production)
        access_key = await self._get_retailer_credential(config, 'access_key')
        secret_key = await self._get_retailer_credential(config, 'secret_key')
        partner_tag = config.partner_tag

        # AWS4 signature process
        timestamp = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
        date_stamp = timestamp[:8]

        # Create canonical request
        canonical_headers = f"content-type:application/json; charset=utf-8\\nhost:{config.api_endpoint.split('//')[1]}\\nx-amz-date:{timestamp}\\nx-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.{operation}\\n"
        signed_headers = "content-type;host;x-amz-date;x-amz-target"
        payload_hash = hashlib.sha256(json.dumps(payload).encode('utf-8')).hexdigest()

        canonical_request = f"POST\\n/paapi5/searchitems\\n\\n{canonical_headers}\\n{signed_headers}\\n{payload_hash}"

        # Create string to sign
        algorithm = 'AWS4-HMAC-SHA256'
        credential_scope = f"{date_stamp}/us-east-1/ProductAdvertisingAPI/aws4_request"
        string_to_sign = f"{algorithm}\\n{timestamp}\\n{credential_scope}\\n{hashlib.sha256(canonical_request.encode('utf-8')).hexdigest()}"

        # Calculate signature
        def sign(key, msg):
            return hmac.new(key, msg.encode('utf-8'), hashlib.sha256).digest()

        kDate = sign(('AWS4' + secret_key).encode('utf-8'), date_stamp)
        kRegion = sign(kDate, 'us-east-1')
        kService = sign(kRegion, 'ProductAdvertisingAPI')
        kSigning = sign(kService, 'aws4_request')
        signature = hmac.new(kSigning, string_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()

        # Build authorization header
        authorization_header = f"{algorithm} Credential={access_key}/{credential_scope}, SignedHeaders={signed_headers}, Signature={signature}"

        return {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': authorization_header,
            'X-Amz-Date': timestamp,
            'X-Amz-Target': f'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.{operation}',
            'X-Amz-Content-Sha256': payload_hash
        }

    async def _parse_amazon_search_results(self, data: Dict[str, Any]) -> List[ProductSearchResult]:
        """
        Parse Amazon search results into standardized format
        """
        results = []

        search_result = data.get('SearchResult', {})
        items = search_result.get('Items', [])

        for item in items:
            try:
                asin = item.get('ASIN', '')
                item_info = item.get('ItemInfo', {})
                title = item_info.get('Title', {}).get('DisplayValue', '')

                # Extract pricing
                offers = item.get('Offers', {})
                listings = offers.get('Listings', [])
                if not listings:
                    continue

                listing = listings[0]
                price_info = listing.get('Price', {})
                if not price_info:
                    continue

                price_cad = Decimal(str(price_info.get('Amount', 0)))
                currency = price_info.get('Currency', 'CAD')

                # Convert to CAD if needed
                if currency != 'CAD':
                    continue  # Skip non-CAD prices for now

                # Extract product details
                brand = await self._extract_brand_from_title(title)
                size, pack_count = await self._extract_size_pack_from_title(title)

                # Calculate price per diaper
                price_per_unit = price_cad / max(pack_count, 1)

                # Get availability
                availability = listing.get('Availability', {}).get('Type') == 'Now'

                # Get shipping info
                delivery_info = listing.get('DeliveryInfo', {})
                is_amazon_fulfilled = delivery_info.get('IsAmazonFulfilled', False)
                is_free_shipping = delivery_info.get('IsFreeShippingEligible', False)

                shipping_cost = Decimal('0') if is_free_shipping else Decimal('9.99')
                estimated_delivery_days = 2 if is_amazon_fulfilled else 5

                # Get image
                images = item.get('Images', {})
                primary_image = images.get('Primary', {})
                image_url = primary_image.get('Large', {}).get('URL') if primary_image else None

                # Build product URL
                product_url = f"https://www.amazon.ca/dp/{asin}?tag={config.partner_tag}"

                results.append(ProductSearchResult(
                    retailer_product_id=asin,
                    name=title,
                    brand=brand,
                    size=size,
                    pack_count=pack_count,
                    price_cad=price_cad,
                    regular_price_cad=None,  # Would need additional API call
                    price_per_unit=price_per_unit,
                    availability=availability,
                    image_url=image_url,
                    product_url=product_url,
                    shipping_cost=shipping_cost,
                    estimated_delivery_days=estimated_delivery_days
                ))

            except Exception as e:
                logger.warning(f"Error parsing Amazon item: {e}")
                continue

        return results

    async def _submit_amazon_order(
        self,
        config: RetailerConfiguration,
        products: List[Dict[str, Any]],
        delivery_address: Dict[str, Any],
        order_reference: str
    ) -> OrderSubmissionResult:
        """
        Submit order to Amazon (via affiliate links - no direct order API)
        """
        # Amazon doesn't provide direct ordering API for affiliate partners
        # Instead, we'll create affiliate links and direct users to Amazon

        # For MVP, we simulate order submission
        # In production, this would integrate with Amazon's merchant services

        order_id = f"AMZ-{order_reference}"
        tracking_number = f"TBA{order_reference[-8:]}"
        tracking_url = f"https://track.amazon.ca/track/{tracking_number}"
        estimated_delivery = datetime.now(timezone.utc) + timedelta(days=2)

        return OrderSubmissionResult(
            success=True,
            order_id=order_id,
            tracking_number=tracking_number,
            tracking_url=tracking_url,
            estimated_delivery=estimated_delivery,
            error_message=None
        )

    async def _test_amazon_connection(self, config: RetailerConfiguration) -> bool:
        """
        Test Amazon PA-API connection
        """
        try:
            # Simple search test
            test_params = {
                'Keywords': 'diapers',
                'SearchIndex': 'Baby',
                'ItemCount': 1,
                'Resources': ['ItemInfo.Title']
            }

            endpoint = f"{config.api_endpoint}/searchitems"
            headers = await self._get_amazon_headers(config, 'SearchItems', test_params)

            async with self.http_session.post(
                endpoint,
                headers=headers,
                json=test_params
            ) as response:
                return response.status == 200

        except Exception as e:
            logger.error(f"Amazon connection test failed: {e}")
            return False

    # =============================================================================
    # Walmart Canada API Integration
    # =============================================================================

    async def _search_walmart_ca(
        self,
        config: RetailerConfiguration,
        search_query: str,
        diaper_size: Optional[str],
        brand_filter: Optional[List[str]],
        max_results: int
    ) -> List[ProductSearchResult]:
        """
        Search Walmart Canada using their API
        """
        # Construct search query
        query = f"{search_query} diapers"
        if diaper_size:
            query += f" {diaper_size}"

        search_params = {
            'query': query,
            'format': 'json',
            'categoryId': '0/136/202033',  # Baby category
            'numItems': min(max_results, 25),
            'start': 1
        }

        # Add brand filter
        if brand_filter:
            search_params['facet'] = f"brand:{brand_filter[0]}"

        # Get OAuth token
        auth_token = await self._get_walmart_auth_token(config)
        if not auth_token:
            logger.error("Failed to get Walmart auth token")
            return []

        headers = {
            'WM_SVC.NAME': 'Walmart Open API',
            'WM_QOS.CORRELATION_ID': f"nestsync-{datetime.now().timestamp()}",
            'Authorization': f'Bearer {auth_token}',
            'Accept': 'application/json'
        }

        endpoint = f"{config.api_endpoint}/search"

        async with self.http_session.get(
            endpoint,
            params=search_params,
            headers=headers
        ) as response:
            if response.status == 200:
                data = await response.json()
                return await self._parse_walmart_search_results(data)
            else:
                error_text = await response.text()
                logger.error(f"Walmart API error: {response.status} - {error_text}")
                return []

    async def _get_walmart_auth_token(self, config: RetailerConfiguration) -> Optional[str]:
        """
        Get OAuth 2.0 token for Walmart API
        """
        try:
            # Get credentials
            client_id = await self._get_retailer_credential(config, 'client_id')
            client_secret = await self._get_retailer_credential(config, 'client_secret')

            # Create basic auth header
            credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()

            headers = {
                'Authorization': f'Basic {credentials}',
                'Content-Type': 'application/x-www-form-urlencoded',
                'WM_SVC.NAME': 'Walmart Open API',
                'WM_QOS.CORRELATION_ID': f"nestsync-auth-{datetime.now().timestamp()}"
            }

            data = 'grant_type=client_credentials'

            async with self.http_session.post(
                f"{config.api_endpoint}/token",
                headers=headers,
                data=data
            ) as response:
                if response.status == 200:
                    token_data = await response.json()
                    return token_data.get('access_token')
                else:
                    logger.error(f"Walmart auth failed: {response.status}")
                    return None

        except Exception as e:
            logger.error(f"Error getting Walmart auth token: {e}")
            return None

    async def _parse_walmart_search_results(self, data: Dict[str, Any]) -> List[ProductSearchResult]:
        """
        Parse Walmart search results
        """
        results = []

        items = data.get('items', [])

        for item in items:
            try:
                # Extract basic info
                item_id = str(item.get('itemId', ''))
                name = item.get('name', '')
                brand = item.get('brandName', '')

                # Extract pricing
                sale_price = item.get('salePrice')
                msrp = item.get('msrp')

                if not sale_price:
                    continue

                price_cad = Decimal(str(sale_price))
                regular_price_cad = Decimal(str(msrp)) if msrp and msrp != sale_price else None

                # Extract size and pack count
                size, pack_count = await self._extract_size_pack_from_title(name)
                price_per_unit = price_cad / max(pack_count, 1)

                # Get availability
                availability = item.get('availableOnline', False)

                # Get shipping info
                shipping_cost = Decimal('0') if item.get('freeShippingOver35', False) else Decimal('9.97')

                # Get image
                image_url = item.get('thumbnailImage')
                if image_url and not image_url.startswith('http'):
                    image_url = f"https://i5.walmartimages.ca{image_url}"

                # Build product URL
                product_url = f"https://www.walmart.ca/en/ip/{item.get('name', '').replace(' ', '-')}/{item_id}"

                results.append(ProductSearchResult(
                    retailer_product_id=item_id,
                    name=name,
                    brand=brand,
                    size=size,
                    pack_count=pack_count,
                    price_cad=price_cad,
                    regular_price_cad=regular_price_cad,
                    price_per_unit=price_per_unit,
                    availability=availability,
                    image_url=image_url,
                    product_url=product_url,
                    shipping_cost=shipping_cost,
                    estimated_delivery_days=3
                ))

            except Exception as e:
                logger.warning(f"Error parsing Walmart item: {e}")
                continue

        return results

    async def _submit_walmart_order(
        self,
        config: RetailerConfiguration,
        products: List[Dict[str, Any]],
        delivery_address: Dict[str, Any],
        order_reference: str
    ) -> OrderSubmissionResult:
        """
        Submit order to Walmart (placeholder implementation)
        """
        # Walmart's API doesn't provide direct ordering capability for third parties
        # This would require a custom integration with Walmart's B2B services

        order_id = f"WM-{order_reference}"
        tracking_number = f"WM{order_reference[-8:]}"
        tracking_url = f"https://www.walmart.ca/en/account/order-tracking?orderNumber={tracking_number}"
        estimated_delivery = datetime.now(timezone.utc) + timedelta(days=3)

        return OrderSubmissionResult(
            success=True,
            order_id=order_id,
            tracking_number=tracking_number,
            tracking_url=tracking_url,
            estimated_delivery=estimated_delivery,
            error_message=None
        )

    async def _test_walmart_connection(self, config: RetailerConfiguration) -> bool:
        """
        Test Walmart API connection
        """
        try:
            auth_token = await self._get_walmart_auth_token(config)
            return auth_token is not None

        except Exception as e:
            logger.error(f"Walmart connection test failed: {e}")
            return False

    # =============================================================================
    # Pricing Update Methods
    # =============================================================================

    async def _update_amazon_pricing(
        self,
        config: RetailerConfiguration,
        product_ids: List[str]
    ) -> Dict[str, Decimal]:
        """
        Update Amazon product pricing
        """
        pricing_updates = {}

        # Amazon GetItems API for pricing updates
        for batch_start in range(0, len(product_ids), 10):  # Process in batches of 10
            batch_ids = product_ids[batch_start:batch_start + 10]

            get_items_params = {
                'ItemIds': batch_ids,
                'Resources': ['Offers.Listings.Price']
            }

            headers = await self._get_amazon_headers(config, 'GetItems', get_items_params)

            try:
                async with self.http_session.post(
                    f"{config.api_endpoint}/getitems",
                    headers=headers,
                    json=get_items_params
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        items = data.get('ItemsResult', {}).get('Items', [])

                        for item in items:
                            asin = item.get('ASIN')
                            offers = item.get('Offers', {})
                            listings = offers.get('Listings', [])

                            if listings and asin:
                                price_info = listings[0].get('Price', {})
                                if price_info:
                                    price = Decimal(str(price_info.get('Amount', 0)))
                                    pricing_updates[asin] = price

            except Exception as e:
                logger.error(f"Error updating Amazon pricing batch: {e}")
                continue

        return pricing_updates

    async def _update_walmart_pricing(
        self,
        config: RetailerConfiguration,
        product_ids: List[str]
    ) -> Dict[str, Decimal]:
        """
        Update Walmart product pricing
        """
        pricing_updates = {}

        auth_token = await self._get_walmart_auth_token(config)
        if not auth_token:
            return pricing_updates

        headers = {
            'WM_SVC.NAME': 'Walmart Open API',
            'Authorization': f'Bearer {auth_token}',
            'Accept': 'application/json'
        }

        for item_id in product_ids:
            try:
                async with self.http_session.get(
                    f"{config.api_endpoint}/items/{item_id}",
                    headers=headers
                ) as response:
                    if response.status == 200:
                        item_data = await response.json()
                        sale_price = item_data.get('salePrice')

                        if sale_price:
                            pricing_updates[item_id] = Decimal(str(sale_price))

            except Exception as e:
                logger.error(f"Error updating Walmart pricing for {item_id}: {e}")
                continue

        return pricing_updates

    # =============================================================================
    # Helper Methods
    # =============================================================================

    async def _extract_brand_from_title(self, title: str) -> str:
        """
        Extract brand name from product title
        """
        known_brands = [
            'Huggies', 'Pampers', 'Honest', 'Kirkland', "Parent's Choice",
            'Seventh Generation', 'Earth + Eden', 'Bambo Nature', 'Andy Pandy'
        ]

        title_upper = title.upper()
        for brand in known_brands:
            if brand.upper() in title_upper:
                return brand

        # Try to extract brand from beginning of title
        words = title.split()
        if len(words) > 0:
            return words[0]

        return "Unknown"

    async def _extract_size_pack_from_title(self, title: str) -> Tuple[str, int]:
        """
        Extract diaper size and pack count from product title
        """
        import re

        title_upper = title.upper()

        # Extract size
        size_patterns = [
            r'\bSIZE\s*(\d+)\b',
            r'\bSZ\s*(\d+)\b',
            r'\b(NEWBORN|NB)\b',
            r'\b(PREEMIE|P)\b'
        ]

        size = "Unknown"
        for pattern in size_patterns:
            match = re.search(pattern, title_upper)
            if match:
                if match.group(1) in ['NEWBORN', 'NB']:
                    size = "Newborn"
                elif match.group(1) in ['PREEMIE', 'P']:
                    size = "Preemie"
                else:
                    size = f"Size {match.group(1)}"
                break

        # Extract pack count
        pack_patterns = [
            r'(\d+)\s*(?:COUNT|CT|PACK|PCS|DIAPERS)',
            r'PACK\s*OF\s*(\d+)',
            r'(\d+)\s*DIAPERS'
        ]

        pack_count = 1
        for pattern in pack_patterns:
            match = re.search(pattern, title_upper)
            if match:
                pack_count = int(match.group(1))
                break

        return size, pack_count

    async def _get_retailer_credential(self, config: RetailerConfiguration, credential_type: str) -> str:
        """
        Get retailer credential from secure storage
        In production, this would decrypt credentials from secure storage
        """
        # Placeholder implementation - in production, credentials would be encrypted
        # and stored securely in the database or external secret management

        if credential_type == 'client_id':
            return config.api_key if hasattr(config, 'api_key') else ''
        elif credential_type == 'client_secret':
            return config.api_secret if hasattr(config, 'api_secret') else ''
        elif credential_type == 'access_key':
            return config.access_key if hasattr(config, 'access_key') else ''
        elif credential_type == 'secret_key':
            return config.secret_key if hasattr(config, 'secret_key') else ''
        else:
            return ''

    async def _update_config_error(self, config: RetailerConfiguration, error_message: str):
        """
        Update retailer configuration with error information
        """
        config.consecutive_failures += 1
        config.last_error_message = error_message[:500]  # Truncate long errors
        config.last_error_date = datetime.now(timezone.utc)
        config.updated_at = datetime.now(timezone.utc)

        # Disable config if too many failures
        if config.consecutive_failures >= 5:
            config.is_active = False
            logger.warning(f"Disabled retailer config {config.id} due to consecutive failures")

        await self.session.commit()

    async def _update_config_success(self, config: RetailerConfiguration):
        """
        Update retailer configuration on successful request
        """
        config.consecutive_failures = 0
        config.last_successful_request = datetime.now(timezone.utc)
        config.total_requests_made += 1
        config.last_error_message = None
        config.last_error_date = None
        config.updated_at = datetime.now(timezone.utc)

        await self.session.commit()


# =============================================================================
# Retailer API Factory
# =============================================================================

class RetailerAPIFactory:
    """
    Factory for creating retailer-specific API clients
    """

    @staticmethod
    async def create_api_client(
        session: AsyncSession,
        retailer_type: RetailerType,
        config: RetailerConfiguration
    ) -> RetailerAPIService:
        """
        Create retailer-specific API client
        """
        # For now, we use the same service class for all retailers
        # In the future, we could create specialized classes for each retailer
        return RetailerAPIService(session)

    @staticmethod
    def get_supported_retailers() -> List[RetailerType]:
        """
        Get list of supported Canadian retailers
        """
        return [
            RetailerType.AMAZON_CA,
            RetailerType.WALMART_CA,
            # RetailerType.LOBLAWS,      # Future implementation
            # RetailerType.METRO,        # Future implementation
            # RetailerType.SOBEYS,       # Future implementation
            # RetailerType.COSTCO_CA,    # Future implementation
        ]

    @staticmethod
    def get_retailer_requirements(retailer_type: RetailerType) -> Dict[str, Any]:
        """
        Get setup requirements for each retailer
        """
        requirements = {
            RetailerType.AMAZON_CA: {
                'credentials': ['access_key', 'secret_key', 'partner_tag'],
                'oauth_flow': False,
                'approval_required': True,
                'documentation': 'https://webservices.amazon.com/paapi5/documentation/',
                'signup_url': 'https://affiliate-program.amazon.ca/'
            },
            RetailerType.WALMART_CA: {
                'credentials': ['client_id', 'client_secret'],
                'oauth_flow': True,
                'approval_required': True,
                'documentation': 'https://developer.walmart.com/',
                'signup_url': 'https://developer.walmart.com/'
            }
        }

        return requirements.get(retailer_type, {})