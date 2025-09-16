"""
Data transformation utilities for NestSync backend
Provides Canadian-specific constants and data transformation functions
"""

from typing import Dict, List, Optional
from enum import Enum


class CanadianProvince(str, Enum):
    """Canadian province codes"""
    AB = "AB"  # Alberta
    BC = "BC"  # British Columbia
    MB = "MB"  # Manitoba
    NB = "NB"  # New Brunswick
    NL = "NL"  # Newfoundland and Labrador
    NS = "NS"  # Nova Scotia
    NT = "NT"  # Northwest Territories
    NU = "NU"  # Nunavut
    ON = "ON"  # Ontario
    PE = "PE"  # Prince Edward Island
    QC = "QC"  # Quebec
    SK = "SK"  # Saskatchewan
    YT = "YT"  # Yukon


# Canadian timezone constants
TIMEZONE_CANADA = {
    'America/Vancouver': ['BC', 'YT'],
    'America/Edmonton': ['AB', 'NT', 'NU'],  # Mountain time
    'America/Regina': ['SK'],
    'America/Winnipeg': ['MB'],  # Central time
    'America/Toronto': ['ON'],  # Eastern time
    'America/Montreal': ['QC'],
    'America/Halifax': ['NS', 'NB', 'PE'],  # Atlantic time
    'America/St_Johns': ['NL'],  # Newfoundland time
}

# Default timezone mapping for provinces
PROVINCE_TIMEZONE_MAP: Dict[str, str] = {
    'BC': 'America/Vancouver',
    'YT': 'America/Vancouver',
    'AB': 'America/Edmonton',
    'NT': 'America/Edmonton',
    'NU': 'America/Edmonton',  # Simplified - Nunavut has multiple zones
    'SK': 'America/Regina',
    'MB': 'America/Winnipeg',
    'ON': 'America/Toronto',
    'QC': 'America/Montreal',
    'NB': 'America/Halifax',
    'NS': 'America/Halifax',
    'PE': 'America/Halifax',
    'NL': 'America/St_Johns',
}

# Canadian province names
CANADIAN_PROVINCES: Dict[str, str] = {
    'AB': 'Alberta',
    'BC': 'British Columbia',
    'MB': 'Manitoba',
    'NB': 'New Brunswick',
    'NL': 'Newfoundland and Labrador',
    'NS': 'Nova Scotia',
    'NT': 'Northwest Territories',
    'NU': 'Nunavut',
    'ON': 'Ontario',
    'PE': 'Prince Edward Island',
    'QC': 'Quebec',
    'SK': 'Saskatchewan',
    'YT': 'Yukon',
}

# Default Canadian settings
DEFAULT_CANADIAN_TIMEZONE = 'America/Toronto'
DEFAULT_CANADIAN_LANGUAGE = 'en-CA'


def get_timezone_for_province(province: str) -> str:
    """Get the default timezone for a Canadian province"""
    return PROVINCE_TIMEZONE_MAP.get(province, DEFAULT_CANADIAN_TIMEZONE)


def get_province_name(province_code: str) -> Optional[str]:
    """Get the full name for a province code"""
    return CANADIAN_PROVINCES.get(province_code)


def is_valid_canadian_province(province: str) -> bool:
    """Check if a province code is valid"""
    return province in CANADIAN_PROVINCES


def get_provinces_in_timezone(timezone: str) -> List[str]:
    """Get list of provinces in a given timezone"""
    return TIMEZONE_CANADA.get(timezone, [])


def get_timezone_aware_today_boundaries(user_timezone: str = DEFAULT_CANADIAN_TIMEZONE) -> tuple:
    """
    Get timezone-aware start and end datetime boundaries for "today"
    Returns UTC datetimes for database queries

    Args:
        user_timezone: User's timezone (defaults to Toronto)

    Returns:
        tuple: (today_start_utc, today_end_utc)
    """
    import pytz
    from datetime import datetime, time, timedelta, timezone

    try:
        user_tz = pytz.timezone(user_timezone)
    except pytz.UnknownTimeZoneError:
        user_tz = pytz.timezone(DEFAULT_CANADIAN_TIMEZONE)

    # Get today's date in user's timezone
    now_user_tz = datetime.now(user_tz)
    today_date = now_user_tz.date()

    # Create start of day (00:00) in user's timezone
    today_start = datetime.combine(today_date, time.min)
    today_start = user_tz.localize(today_start)

    # Create end of day (start of tomorrow) in user's timezone
    today_end = datetime.combine(today_date + timedelta(days=1), time.min)
    today_end = user_tz.localize(today_end)

    # Convert to UTC for database queries
    today_start_utc = today_start.astimezone(pytz.UTC)
    today_end_utc = today_end.astimezone(pytz.UTC)

    return today_start_utc, today_end_utc