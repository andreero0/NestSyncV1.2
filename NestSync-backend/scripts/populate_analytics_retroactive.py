#!/usr/bin/env python3
"""
NestSync Retroactive Analytics Data Population
==============================================

A simpler version of the analytics data populator that bypasses the time_since_last_change
constraint issue by using direct database insertion instead of GraphQL mutations.

This generates 90 days of realistic weekday vs weekend analytics data directly into
the database, avoiding the constraint violation issues.
"""

import asyncio
import random
import sys
import argparse
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
import uuid
from zoneinfo import ZoneInfo

# Add the parent directory to the path to import app modules
sys.path.append('/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/NestSync-backend')

from app.config.database import get_async_session, create_database_engines
from app.models.inventory import UsageLog
from app.models.child import Child
from sqlalchemy import select, and_, desc, func
from sqlalchemy.dialects.postgresql import insert

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Canadian timezone for realistic data generation
CANADA_TZ = ZoneInfo("America/Toronto")

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

        return changes

class RetrospectiveDataPopulator:
    """Populates historical data directly into database to avoid constraint issues"""

    def __init__(self):
        self.pattern_generator = RealisticPatternGenerator()
        self.child_id = None

    async def find_test_child(self) -> Optional[str]:
        """Find the test child from parents@nestsync.com account"""
        async for session in get_async_session():
            # Find any child in the system for now
            child_query = select(Child).where(Child.is_deleted == False).limit(1)
            result = await session.execute(child_query)
            child = result.scalar_one_or_none()

            if child:
                self.child_id = str(child.id)

                # Update pattern generator based on child's age
                age_result = await session.execute(
                    select(func.extract('year', func.age(func.current_date(), Child.date_of_birth)))
                    .where(Child.id == child.id)
                )
                age_years = age_result.scalar_one_or_none() or 0.5
                age_months = int(age_years * 12)
                self.pattern_generator = RealisticPatternGenerator(age_months)

                logger.info(f"Using child: {child.name} (ID: {self.child_id}, Age: {age_months} months)")
                return self.child_id

            logger.error("No children found in database")
            return None

    async def populate_historical_data(self, days_back: int = 90, dry_run: bool = False) -> bool:
        """Populate historical data directly into the database"""
        logger.info(f"Populating {days_back} days of historical diaper change data...")

        if dry_run:
            logger.info("DRY RUN MODE - No data will be written to database")

        # Calculate date range
        end_date = datetime.now(CANADA_TZ).replace(hour=0, minute=0, second=0, microsecond=0)
        start_date = end_date - timedelta(days=days_back)

        # Generate all changes first
        all_changes = []
        current_date = start_date
        while current_date < end_date:
            daily_changes = self.pattern_generator.generate_day_pattern(current_date)
            all_changes.extend(daily_changes)
            current_date += timedelta(days=1)

        # Sort by timestamp
        all_changes.sort(key=lambda x: x.timestamp)
        logger.info(f"Generated {len(all_changes)} total changes")

        if dry_run:
            logger.info("Sample of generated changes:")
            for change in all_changes[:10]:
                logger.info(f"  Would create: {change.timestamp} - Wet: {change.was_wet}, Soiled: {change.was_soiled}")
            return True

        # Insert data directly into database
        async for session in get_async_session():
            try:
                child_uuid = uuid.UUID(self.child_id)

                # Calculate time_since_last_change correctly for historical data
                for i, change in enumerate(all_changes):
                    # For retroactive data, calculate based on PREVIOUS change in our sorted list
                    time_since_last = None
                    if i > 0:
                        previous_change = all_changes[i - 1]
                        time_since_last = int((change.timestamp - previous_change.timestamp).total_seconds() / 60)

                    # Create usage log entry
                    usage_log = UsageLog(
                        child_id=child_uuid,
                        usage_type="diaper_change",
                        logged_at=change.timestamp,
                        quantity_used=1,
                        context=change.context.upper(),
                        caregiver_name=change.caregiver_name,
                        was_wet=change.was_wet,
                        was_soiled=change.was_soiled,
                        time_since_last_change=time_since_last,
                        notes=change.notes
                    )

                    session.add(usage_log)

                    # Commit every 50 records to avoid overwhelming the database
                    if (i + 1) % 50 == 0:
                        await session.commit()
                        logger.info(f"Inserted {i + 1}/{len(all_changes)} records...")

                # Final commit
                await session.commit()

                # Statistics
                weekday_changes = sum(1 for change in all_changes if not self.pattern_generator.is_weekend(change.timestamp))
                weekend_changes = len(all_changes) - weekday_changes

                logger.info("\n" + "="*60)
                logger.info("RETROACTIVE DATA POPULATION COMPLETE")
                logger.info("="*60)
                logger.info(f"Total changes: {len(all_changes)}")
                logger.info(f"Weekday changes: {weekday_changes}")
                logger.info(f"Weekend changes: {weekend_changes}")
                logger.info(f"Weekend/Weekday ratio: {weekend_changes / max(1, weekday_changes):.2f}")
                logger.info(f"Average per day: {len(all_changes) / days_back:.1f}")
                logger.info("✅ Your analytics now have realistic weekday vs weekend patterns!")

                return True

            except Exception as e:
                logger.error(f"Database insertion failed: {e}")
                await session.rollback()
                return False

async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Populate retroactive analytics data directly")
    parser.add_argument("--days-back", type=int, default=90, help="Number of days to generate (default: 90)")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be generated without writing to database")

    args = parser.parse_args()

    populator = RetrospectiveDataPopulator()

    try:
        # Step 0: Initialize database
        logger.info("Step 0: Initializing database connection...")
        create_database_engines()

        # Step 1: Find child
        logger.info("Step 1: Finding test child...")
        child_id = await populator.find_test_child()
        if not child_id:
            logger.error("No child found. Please ensure there's a child profile in the database.")
            return 1

        # Step 2: Populate historical data
        logger.info("Step 2: Populating historical data...")
        success = await populator.populate_historical_data(args.days_back, args.dry_run)

        if success:
            logger.info("✅ Retroactive data population completed successfully!")
            return 0
        else:
            logger.error("❌ Data population failed.")
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