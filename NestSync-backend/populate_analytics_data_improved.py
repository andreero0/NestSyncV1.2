#!/usr/bin/env python3
"""
NestSync Analytics Data Population Script - IMPROVED VERSION
==========================================================

FIXES THE TIME_SINCE_LAST_CHANGE CONSTRAINT VIOLATION ISSUE

This improved version includes awareness of the constraint issue and provides
better error handling and guidance for retroactive data population.

Key improvements:
- Detects constraint violations and provides helpful guidance
- Better error messages explaining the issue
- Integration with fix_retroactive_data_population.py
- Safer approach to historical data population

Usage:
    # Recommended workflow for retroactive data:
    python fix_retroactive_data_population.py --action prepare
    python populate_analytics_data_improved.py --days-back 90
    python fix_retroactive_data_population.py --action cleanup

    # For current/future data (no constraint issues):
    python populate_analytics_data_improved.py --days-back 7
"""

import asyncio
import random
import sys
import argparse
import logging
from datetime import datetime, timezone, timedelta, time
from typing import List, Dict, Tuple, Optional
import requests
import json
from dataclasses import dataclass
import uuid
from zoneinfo import ZoneInfo

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Canadian timezone for realistic data generation
CANADA_TZ = ZoneInfo("America/Toronto")
GRAPHQL_ENDPOINT = "http://localhost:8001/graphql"

# Test account credentials from CLAUDE.md
TEST_EMAIL = "parents@nestsync.com"
TEST_PASSWORD = "Shazam11#"

@dataclass
class DiaperChange:
    """Represents a single diaper change event"""
    timestamp: datetime
    was_wet: bool
    was_soiled: bool
    context: str
    caregiver_name: str
    notes: Optional[str] = None

class RealisticPatternGenerator:
    """Generates realistic diaper change patterns with weekday/weekend variations"""

    def __init__(self, child_age_months: int = 6):
        self.child_age_months = child_age_months

        # Age-based frequency patterns
        if child_age_months < 3:
            self.base_daily_frequency = 10  # Newborns
        elif child_age_months < 12:
            self.base_daily_frequency = 7   # Infants
        else:
            self.base_daily_frequency = 5   # Toddlers

    def is_weekend(self, date: datetime) -> bool:
        """Check if date is weekend (Saturday=5, Sunday=6)"""
        return date.weekday() >= 5

    def generate_day_pattern(self, target_date: datetime) -> List[DiaperChange]:
        """Generate realistic diaper changes for a specific day"""
        changes = []

        # Adjust frequency based on day type and variations
        base_freq = self.base_daily_frequency
        day_multiplier = self.get_day_multiplier(target_date)
        daily_frequency = max(3, int(base_freq * day_multiplier))

        if self.is_weekend(target_date):
            changes = self._generate_weekend_pattern(target_date, daily_frequency)
        else:
            changes = self._generate_weekday_pattern(target_date, daily_frequency)

        # Add natural variation and edge cases
        changes = self._add_natural_variations(changes, target_date)

        # Sort by timestamp
        changes.sort(key=lambda x: x.timestamp)

        return changes

    def get_day_multiplier(self, date: datetime) -> float:
        """Get frequency multiplier based on day patterns"""
        day_of_week = date.weekday()

        # Day-specific patterns
        multipliers = {
            0: 0.9,   # Monday - lower (weekend recovery)
            1: 1.0,   # Tuesday - normal
            2: 1.0,   # Wednesday - normal
            3: 1.05,  # Thursday - slightly higher
            4: 1.1,   # Friday - higher (anticipating weekend)
            5: 1.3,   # Saturday - weekend boost
            6: 1.2,   # Sunday - weekend but calmer
        }

        base_multiplier = multipliers[day_of_week]

        # Add seasonal variations
        month = date.month
        if month in [6, 7, 8]:  # Summer - more hydration
            base_multiplier *= 1.15
        elif month in [11, 12, 1]:  # Winter - slightly less
            base_multiplier *= 0.95

        # Random daily variation (±15%)
        daily_variation = random.uniform(0.85, 1.15)

        return base_multiplier * daily_variation

    def _generate_weekday_pattern(self, date: datetime, frequency: int) -> List[DiaperChange]:
        """Generate structured weekday pattern with morning/evening peaks"""
        changes = []

        # Weekday time slots with weights (higher = more likely)
        time_slots = [
            (6, 8, 3.0),    # Morning rush
            (8, 12, 1.5),   # Morning activities
            (12, 17, 2.0),  # Daycare/afternoon
            (17, 19, 2.5),  # Evening return/dinner
            (19, 22, 1.0),  # Evening wind-down
            (22, 6, 0.3),   # Overnight (minimal)
        ]

        changes = self._distribute_changes_by_slots(date, frequency, time_slots, "weekday")
        return changes

    def _generate_weekend_pattern(self, date: datetime, frequency: int) -> List[DiaperChange]:
        """Generate relaxed weekend pattern with even distribution"""
        changes = []

        # Weekend time slots - more evenly distributed
        time_slots = [
            (7, 10, 1.5),   # Lazy morning
            (10, 14, 2.0),  # Family activities
            (14, 18, 2.2),  # Afternoon adventures
            (18, 21, 1.8),  # Family dinner/time
            (21, 23, 1.0),  # Evening relaxation
            (23, 7, 0.5),   # More attention at night
        ]

        changes = self._distribute_changes_by_slots(date, frequency, time_slots, "weekend")
        return changes

    def _distribute_changes_by_slots(self, date: datetime, frequency: int,
                                   time_slots: List[Tuple[int, int, float]],
                                   day_type: str) -> List[DiaperChange]:
        """Distribute diaper changes across time slots with weighted probabilities"""
        changes = []

        # Calculate total weight
        total_weight = sum(weight for _, _, weight in time_slots)

        # Distribute frequency across time slots
        remaining_frequency = frequency
        for start_hour, end_hour, weight in time_slots:
            # Calculate how many changes for this slot
            slot_probability = weight / total_weight
            slot_changes = max(0, round(frequency * slot_probability))

            # Generate changes for this time slot
            for _ in range(min(slot_changes, remaining_frequency)):
                change = self._create_realistic_change(date, start_hour, end_hour, day_type)
                changes.append(change)
                remaining_frequency -= 1

                if remaining_frequency <= 0:
                    break

            if remaining_frequency <= 0:
                break

        return changes

    def _create_realistic_change(self, date: datetime, start_hour: int,
                               end_hour: int, day_type: str) -> DiaperChange:
        """Create a realistic diaper change within specified time window"""

        # Handle overnight time slots (e.g., 22-6)
        if start_hour > end_hour:
            if random.random() < 0.7:  # 70% chance in first part
                hour = random.randint(start_hour, 23)
                change_date = date
            else:  # 30% chance in second part (next day)
                hour = random.randint(0, end_hour)
                change_date = date + timedelta(days=1)
        else:
            hour = random.randint(start_hour, min(end_hour - 1, 23))
            change_date = date

        minute = random.randint(0, 59)

        # Create timezone-aware timestamp
        timestamp = change_date.replace(
            hour=hour,
            minute=minute,
            second=0,
            microsecond=0,
            tzinfo=CANADA_TZ
        ).astimezone(timezone.utc)

        # Realistic wet/soiled patterns by time of day
        was_wet, was_soiled = self._get_realistic_conditions(hour)

        # Context and caregiver based on time and day type
        context, caregiver = self._get_realistic_context(hour, day_type)

        # Occasional notes for variety
        notes = None
        if random.random() < 0.05:  # 5% chance of notes
            notes_options = [
                "Quick change before nap",
                "Needed extra wipes",
                "Happy baby today!",
                "Growth spurt week",
                "Leaked a little"
            ]
            notes = random.choice(notes_options)

        return DiaperChange(
            timestamp=timestamp,
            was_wet=was_wet,
            was_soiled=was_soiled,
            context=context,
            caregiver_name=caregiver,
            notes=notes
        )

    def _get_realistic_conditions(self, hour: int) -> Tuple[bool, bool]:
        """Get realistic wet/soiled conditions based on time of day"""

        # Soiled more likely during active hours
        if 6 <= hour <= 20:  # Daytime
            wet_probability = 0.85
            soiled_probability = 0.4
        else:  # Nighttime
            wet_probability = 0.95  # Almost always wet at night
            soiled_probability = 0.2  # Less likely to be soiled

        # Early morning often has overnight accumulation
        if 5 <= hour <= 7:
            soiled_probability *= 1.5

        was_wet = random.random() < wet_probability
        was_soiled = random.random() < soiled_probability

        # Ensure at least one condition is true
        if not was_wet and not was_soiled:
            was_wet = True

        return was_wet, was_soiled

    def _get_realistic_context(self, hour: int, day_type: str) -> Tuple[str, str]:
        """Get realistic context and caregiver based on time and day type"""

        contexts = ["home", "daycare", "outing", "grandparents", "travel"]
        caregivers = ["Mom", "Dad", "Grandma", "Grandpa", "Daycare Staff"]

        # Time-based context selection
        if day_type == "weekday":
            if 7 <= hour <= 17:  # Work/daycare hours
                if random.random() < 0.7:  # 70% daycare
                    return "daycare", "Daycare Staff"
                else:
                    return "home", random.choice(["Mom", "Dad"])
            else:  # Home time
                return "home", random.choice(["Mom", "Dad"])
        else:  # Weekend
            if 10 <= hour <= 18 and random.random() < 0.3:  # 30% chance outing
                context = random.choice(["outing", "grandparents"])
                if context == "grandparents":
                    caregiver = random.choice(["Grandma", "Grandpa"])
                else:
                    caregiver = random.choice(["Mom", "Dad"])
                return context, caregiver
            else:
                return "home", random.choice(["Mom", "Dad"])

    def _add_natural_variations(self, changes: List[DiaperChange],
                              date: datetime) -> List[DiaperChange]:
        """Add natural variations and edge cases to make data more realistic"""

        # Occasional "difficult days" with higher frequency
        if random.random() < 0.05:  # 5% chance
            logger.info(f"Adding 'difficult day' variation for {date.date()}")
            extra_changes = random.randint(2, 4)
            for _ in range(extra_changes):
                # Add random changes throughout the day
                hour = random.randint(6, 22)
                minute = random.randint(0, 59)
                timestamp = date.replace(
                    hour=hour, minute=minute, second=0, microsecond=0,
                    tzinfo=CANADA_TZ
                ).astimezone(timezone.utc)

                change = DiaperChange(
                    timestamp=timestamp,
                    was_wet=True,
                    was_soiled=random.random() < 0.3,
                    context="home",
                    caregiver_name=random.choice(["Mom", "Dad"]),
                    notes="Extra busy day"
                )
                changes.append(change)

        # Growth spurts - certain weeks have more changes
        week_of_year = date.isocalendar()[1]
        if week_of_year % 8 == 0 and random.random() < 0.4:  # Growth spurt weeks
            logger.info(f"Adding 'growth spurt' variation for week {week_of_year}")
            extra_change = DiaperChange(
                timestamp=changes[-1].timestamp + timedelta(hours=random.randint(1, 3)),
                was_wet=True,
                was_soiled=random.random() < 0.4,
                context="home",
                caregiver_name="Mom",
                notes="Growth spurt week - extra hungry!"
            )
            changes.append(extra_change)

        return changes

class AnalyticsDataPopulator:
    """Main class for populating analytics data via GraphQL with constraint awareness"""

    def __init__(self, graphql_endpoint: str = GRAPHQL_ENDPOINT):
        self.graphql_endpoint = graphql_endpoint
        self.session = requests.Session()
        self.access_token = None
        self.child_id = None
        self.pattern_generator = RealisticPatternGenerator()
        self.constraint_violation_detected = False

    def _is_retroactive_data(self, days_back: int) -> bool:
        """Check if the requested data range is retroactive (more than 1 day old)"""
        return days_back > 1

    def _detect_constraint_violation(self, error_message: str) -> bool:
        """Detect if error is related to time_since_last_change constraint"""
        constraint_keywords = [
            "check_time_since_last_change_positive",
            "time_since_last_change",
            "constraint violation"
        ]
        return any(keyword in error_message.lower() for keyword in constraint_keywords)

    def _handle_constraint_violation_error(self, days_back: int):
        """Provide helpful guidance when constraint violation is detected"""
        self.constraint_violation_detected = True
        logger.error("❌ CONSTRAINT VIOLATION DETECTED")
        logger.error("=" * 60)
        logger.error("The 'time_since_last_change >= 0' constraint is preventing")
        logger.error("retroactive data insertion due to calculation issues.")
        logger.error("")
        logger.error("SOLUTION:")
        logger.error("1. Run: python fix_retroactive_data_population.py --action prepare")
        logger.error("2. Then re-run this script")
        logger.error("3. Finally: python fix_retroactive_data_population.py --action cleanup")
        logger.error("")
        logger.error("This will temporarily disable the constraint, populate the data,")
        logger.error("fix any calculation issues, and re-enable the constraint.")
        logger.error("=" * 60)

    async def authenticate(self, email: str, password: str) -> bool:
        """Authenticate with the GraphQL API"""
        query = """
        mutation SignIn($input: SignInInput!) {
            signIn(input: $input) {
                success
                message
                error
                user {
                    id
                    email
                    firstName
                    lastName
                }
                session {
                    accessToken
                    refreshToken
                    expiresIn
                }
            }
        }
        """

        response = self.session.post(
            self.graphql_endpoint,
            json={
                "query": query,
                "variables": {"input": {"email": email, "password": password}}
            }
        )

        if response.status_code != 200:
            logger.error(f"Authentication failed: {response.status_code}")
            return False

        data = response.json()
        if data.get("errors"):
            logger.error(f"GraphQL errors: {data['errors']}")
            return False

        sign_in_data = data["data"]["signIn"]
        if not sign_in_data["success"]:
            logger.error(f"Sign in failed: {sign_in_data.get('error', 'Unknown error')}")
            return False

        if not sign_in_data.get("session") or not sign_in_data["session"].get("accessToken"):
            logger.error("No access token received from authentication")
            return False

        self.access_token = sign_in_data["session"]["accessToken"]
        self.session.headers["Authorization"] = f"Bearer {self.access_token}"

        logger.info(f"Successfully authenticated as {sign_in_data['user']['email']}")
        return True

    async def get_child_profile(self, child_id: str = None) -> Optional[str]:
        """Get child profile or find first available child"""
        query = """
        query MyChildren {
            myChildren {
                edges {
                    node {
                        id
                        name
                        currentDiaperSize
                        ageInMonths
                    }
                }
            }
        }
        """

        response = self.session.post(
            self.graphql_endpoint,
            json={"query": query}
        )

        if response.status_code != 200:
            logger.error(f"Failed to fetch children: {response.status_code}")
            return None

        data = response.json()
        if data.get("errors"):
            logger.error(f"GraphQL errors: {data['errors']}")
            return None

        children = data["data"]["myChildren"]["edges"]
        if not children:
            logger.error("No children found for this account")
            return None

        if child_id:
            # Find specific child
            for edge in children:
                if edge["node"]["id"] == child_id:
                    child = edge["node"]
                    self.child_id = child_id
                    logger.info(f"Using child: {child['name']} (ID: {child_id})")
                    return child_id
            logger.error(f"Child ID {child_id} not found")
            return None
        else:
            # Use first child
            child = children[0]["node"]
            self.child_id = child["id"]

            # Update pattern generator based on child's age
            if child.get("ageInMonths"):
                self.pattern_generator = RealisticPatternGenerator(child["ageInMonths"])

            logger.info(f"Using child: {child['name']} (ID: {self.child_id})")
            return self.child_id

    async def create_inventory_items(self) -> bool:
        """Create inventory items to support usage logging"""
        logger.info("Creating inventory items for realistic consumption tracking...")

        # Create multiple diaper packages with different brands and dates
        inventory_items = [
            {
                "brand": "Huggies",
                "product_name": "Little Snugglers",
                "size": "3",
                "quantity_total": 84,
                "cost_cad": 45.99,
                "purchase_date": (datetime.now(timezone.utc) - timedelta(days=15)),
            },
            {
                "brand": "Pampers",
                "product_name": "Baby Dry",
                "size": "3",
                "quantity_total": 92,
                "cost_cad": 42.99,
                "purchase_date": (datetime.now(timezone.utc) - timedelta(days=45)),
            },
            {
                "brand": "Kirkland",
                "product_name": "Supreme",
                "size": "3",
                "quantity_total": 100,
                "cost_cad": 38.99,
                "purchase_date": (datetime.now(timezone.utc) - timedelta(days=75)),
            }
        ]

        create_mutation = """
        mutation CreateInventoryItem($input: CreateInventoryItemInput!) {
            createInventoryItem(input: $input) {
                success
                message
                error
                inventoryItem {
                    id
                    brand
                    size
                    quantityRemaining
                }
            }
        }
        """

        created_items = []
        for item_data in inventory_items:
            input_data = {
                "childId": self.child_id,
                "productType": "DIAPER",
                "brand": item_data["brand"],
                "productName": item_data["product_name"],
                "size": item_data["size"],
                "quantityTotal": item_data["quantity_total"],
                "costCad": item_data["cost_cad"],
            }

            response = self.session.post(
                self.graphql_endpoint,
                json={
                    "query": create_mutation,
                    "variables": {"input": input_data}
                }
            )

            if response.status_code == 200:
                data = response.json()
                if not data.get("errors") and data["data"]["createInventoryItem"]["success"]:
                    created_item = data["data"]["createInventoryItem"]["inventoryItem"]
                    created_items.append(created_item)
                    logger.info(f"Created inventory: {created_item['brand']} Size {created_item['size']} - {created_item['quantityRemaining']} remaining")
                else:
                    logger.warning(f"Failed to create inventory item: {data}")
            else:
                logger.error(f"HTTP error creating inventory: {response.status_code}")

        return len(created_items) > 0

    async def log_diaper_change(self, change: DiaperChange) -> bool:
        """Log a single diaper change via GraphQL with constraint violation detection"""
        mutation = """
        mutation LogDiaperChange($input: LogDiaperChangeInput!) {
            logDiaperChange(input: $input) {
                success
                message
                error
                usageLog {
                    id
                    loggedAt
                    wasWet
                    wasSoiled
                }
            }
        }
        """

        input_data = {
            "childId": self.child_id,
            "usageType": "DIAPER_CHANGE",
            "loggedAt": change.timestamp.isoformat(),
            "wasWet": change.was_wet,
            "wasSoiled": change.was_soiled,
            "context": change.context.upper(),
            "caregiverName": change.caregiver_name,
        }

        if change.notes:
            input_data["notes"] = change.notes

        response = self.session.post(
            self.graphql_endpoint,
            json={
                "query": mutation,
                "variables": {"input": input_data}
            }
        )

        if response.status_code != 200:
            logger.error(f"HTTP error logging change: {response.status_code}")
            return False

        data = response.json()
        if data.get("errors"):
            error_message = str(data['errors'])
            if self._detect_constraint_violation(error_message):
                # Don't log the same constraint error repeatedly
                if not self.constraint_violation_detected:
                    logger.error(f"Constraint violation detected: {error_message}")
                return False
            else:
                logger.error(f"GraphQL errors: {data['errors']}")
                return False

        result = data["data"]["logDiaperChange"]
        if not result["success"]:
            error_msg = result.get('error', 'Unknown error')
            if self._detect_constraint_violation(error_msg):
                # Don't log the same constraint error repeatedly
                if not self.constraint_violation_detected:
                    logger.error(f"Constraint violation detected: {error_msg}")
                return False
            else:
                logger.error(f"Failed to log change: {error_msg}")
                return False

        return True

    async def populate_data(self, days_back: int = 90, dry_run: bool = False) -> bool:
        """Populate database with realistic analytics data"""

        # Check if this is retroactive data and warn user
        if self._is_retroactive_data(days_back) and not dry_run:
            logger.warning("⚠️  RETROACTIVE DATA POPULATION DETECTED")
            logger.warning("=" * 60)
            logger.warning(f"You are trying to populate {days_back} days of historical data.")
            logger.warning("This may cause constraint violations due to time_since_last_change calculations.")
            logger.warning("")
            logger.warning("RECOMMENDED APPROACH:")
            logger.warning("1. Run: python fix_retroactive_data_population.py --action prepare")
            logger.warning("2. Then re-run this command")
            logger.warning("3. Finally: python fix_retroactive_data_population.py --action cleanup")
            logger.warning("")
            logger.warning("Continuing in 5 seconds... (Ctrl+C to cancel)")
            logger.warning("=" * 60)

            try:
                await asyncio.sleep(5)
            except KeyboardInterrupt:
                logger.info("Operation cancelled by user")
                return False

        logger.info(f"Populating {days_back} days of realistic diaper change data...")

        if dry_run:
            logger.info("DRY RUN MODE - No data will be written to database")

        # Calculate date range
        end_date = datetime.now(CANADA_TZ).replace(hour=0, minute=0, second=0, microsecond=0)
        start_date = end_date - timedelta(days=days_back)

        total_changes = 0
        weekday_changes = 0
        weekend_changes = 0
        failed_changes = 0

        # Generate all data first, then sort by timestamp for proper chronological order
        all_changes = []
        current_date = start_date
        while current_date < end_date:
            logger.info(f"Generating data for {current_date.date()}")

            # Generate realistic changes for this day
            daily_changes = self.pattern_generator.generate_day_pattern(current_date)

            # Add to all changes list
            all_changes.extend(daily_changes)

            # Track statistics
            total_changes += len(daily_changes)
            if self.pattern_generator.is_weekend(current_date):
                weekend_changes += len(daily_changes)
            else:
                weekday_changes += len(daily_changes)

            current_date += timedelta(days=1)

        # Sort all changes by timestamp to ensure chronological order
        all_changes.sort(key=lambda x: x.timestamp)

        logger.info(f"Generated {len(all_changes)} total changes, now logging in chronological order...")

        # Log changes unless dry run
        if not dry_run:
            for i, change in enumerate(all_changes):
                success = await self.log_diaper_change(change)
                if not success:
                    failed_changes += 1
                    # If constraint violation detected, provide guidance and stop
                    if self.constraint_violation_detected:
                        self._handle_constraint_violation_error(days_back)
                        return False
                    logger.warning(f"Failed to log change at {change.timestamp}")
                    continue

                # Progress update every 50 changes
                if (i + 1) % 50 == 0:
                    logger.info(f"Logged {i + 1}/{len(all_changes)} changes... ({failed_changes} failures)")

                # Small delay to avoid overwhelming the server
                await asyncio.sleep(0.05)
        else:
            # In dry run, just show sample of what would be generated
            logger.info("Sample of generated changes:")
            for change in all_changes[:10]:  # Show first 10
                logger.info(f"  Would log: {change.timestamp} - Wet: {change.was_wet}, Soiled: {change.was_soiled}, Context: {change.context}")
            if len(all_changes) > 10:
                logger.info(f"  ... and {len(all_changes) - 10} more changes")

        # Summary statistics
        logger.info("\n" + "="*60)
        logger.info("DATA POPULATION SUMMARY")
        logger.info("="*60)
        logger.info(f"Date range: {start_date.date()} to {end_date.date()}")
        logger.info(f"Total changes generated: {total_changes}")
        logger.info(f"Weekday changes: {weekday_changes}")
        logger.info(f"Weekend changes: {weekend_changes}")

        if not dry_run:
            success_rate = ((len(all_changes) - failed_changes) / len(all_changes) * 100) if all_changes else 0
            logger.info(f"Successfully logged: {len(all_changes) - failed_changes}/{len(all_changes)} ({success_rate:.1f}%)")
            if failed_changes > 0:
                logger.info(f"Failed to log: {failed_changes} changes")

        if weekday_changes > 0:
            weekend_ratio = weekend_changes / weekday_changes
            logger.info(f"Weekend/Weekday ratio: {weekend_ratio:.2f}")

        avg_per_day = total_changes / days_back
        avg_weekday = weekday_changes / max(1, (days_back - weekend_changes // avg_per_day))
        avg_weekend = weekend_changes / max(1, weekend_changes // avg_per_day)

        logger.info(f"Average per day: {avg_per_day:.1f}")
        logger.info(f"Average weekday: {avg_weekday:.1f}")
        logger.info(f"Average weekend: {avg_weekend:.1f}")

        if dry_run:
            logger.info("\nDRY RUN COMPLETED - No data was written to database")
        else:
            if failed_changes == 0:
                logger.info("\n✅ DATA POPULATION COMPLETED SUCCESSFULLY!")
                logger.info("Check your analytics dashboard for weekday vs weekend patterns!")
            else:
                logger.warning(f"\n⚠️  DATA POPULATION COMPLETED WITH {failed_changes} FAILURES")
                if self.constraint_violation_detected:
                    logger.info("Use the fix_retroactive_data_population.py script to resolve constraint issues.")

        return failed_changes == 0

async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Populate NestSync with realistic analytics data (improved version)")
    parser.add_argument("--child-id", help="Specific child ID to use (optional)")
    parser.add_argument("--days-back", type=int, default=90, help="Number of days to generate (default: 90)")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be generated without writing to database")
    parser.add_argument("--endpoint", default=GRAPHQL_ENDPOINT, help="GraphQL endpoint URL")

    args = parser.parse_args()

    # Initialize populator
    populator = AnalyticsDataPopulator(args.endpoint)

    try:
        # Step 1: Authenticate
        logger.info("Step 1: Authenticating...")
        if not await populator.authenticate(TEST_EMAIL, TEST_PASSWORD):
            logger.error("Authentication failed. Please check your credentials.")
            return 1

        # Step 2: Get child profile
        logger.info("Step 2: Getting child profile...")
        child_id = await populator.get_child_profile(args.child_id)
        if not child_id:
            logger.error("No child profile found. Please create a child profile first.")
            return 1

        # Step 3: Create inventory items (only if not dry run)
        if not args.dry_run:
            logger.info("Step 3: Creating inventory items...")
            if not await populator.create_inventory_items():
                logger.warning("Failed to create inventory items. Proceeding anyway...")
        else:
            logger.info("Step 3: Skipping inventory creation (dry run mode)")

        # Step 4: Populate data
        logger.info("Step 4: Populating analytics data...")
        success = await populator.populate_data(args.days_back, args.dry_run)

        if success:
            logger.info("✅ Analytics data population completed successfully!")
            if not args.dry_run:
                logger.info("You can now view realistic weekday vs weekend patterns in your analytics dashboard.")
            return 0
        else:
            logger.error("❌ Data population failed.")
            if populator.constraint_violation_detected:
                return 2  # Special exit code for constraint violations
            return 1

    except KeyboardInterrupt:
        logger.info("\nOperation cancelled by user")
        return 1
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)