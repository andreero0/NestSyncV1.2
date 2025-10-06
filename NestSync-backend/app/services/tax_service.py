"""
Canadian Tax Rate Service
PIPEDA-compliant Canadian billing and tax calculations

This module provides Canadian tax calculation services:
- Provincial tax rate lookup (GST/PST/HST/QST)
- Tax breakdown calculation
- Canadian compliance validation
- Tax receipt generation support
"""

from typing import Dict, Optional
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, date
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..models.premium_subscription import CanadianTaxRate
from ..graphql.subscription_types import CanadianProvince, TaxType

logger = logging.getLogger(__name__)


class TaxCalculationResult:
    """Result of tax calculation"""

    def __init__(
        self,
        subtotal: Decimal,
        province: CanadianProvince,
        tax_rate: CanadianTaxRate,
    ):
        self.subtotal = subtotal
        self.province = province
        self.tax_rate_data = tax_rate

        # Calculate individual tax components
        self.gst_amount = self._calculate_gst()
        self.pst_amount = self._calculate_pst()
        self.hst_amount = self._calculate_hst()
        self.qst_amount = self._calculate_qst()

        # Calculate totals
        self.total_tax = self.gst_amount + self.pst_amount + self.hst_amount + self.qst_amount
        self.total_amount = subtotal + self.total_tax

    def _calculate_gst(self) -> Decimal:
        """Calculate GST amount"""
        if self.tax_rate_data.gst_rate:
            return self._round_currency(self.subtotal * self.tax_rate_data.gst_rate)
        return Decimal("0.00")

    def _calculate_pst(self) -> Decimal:
        """Calculate PST amount"""
        if self.tax_rate_data.pst_rate:
            return self._round_currency(self.subtotal * self.tax_rate_data.pst_rate)
        return Decimal("0.00")

    def _calculate_hst(self) -> Decimal:
        """Calculate HST amount"""
        if self.tax_rate_data.hst_rate:
            return self._round_currency(self.subtotal * self.tax_rate_data.hst_rate)
        return Decimal("0.00")

    def _calculate_qst(self) -> Decimal:
        """
        Calculate QST amount (Quebec)
        QST is calculated on subtotal + GST
        """
        if self.tax_rate_data.qst_rate:
            base_amount = self.subtotal + self.gst_amount
            return self._round_currency(base_amount * self.tax_rate_data.qst_rate)
        return Decimal("0.00")

    def _round_currency(self, amount: Decimal) -> Decimal:
        """Round to 2 decimal places (CAD currency)"""
        return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def to_dict(self) -> Dict:
        """Convert to dictionary for API responses"""
        return {
            "subtotal": float(self.subtotal),
            "province": self.province.value,
            "tax_breakdown": {
                "gst": float(self.gst_amount),
                "pst": float(self.pst_amount),
                "hst": float(self.hst_amount),
                "qst": float(self.qst_amount),
            },
            "tax_type": self.tax_rate_data.tax_type.value,
            "combined_rate": float(self.tax_rate_data.combined_rate),
            "total_tax": float(self.total_tax),
            "total_amount": float(self.total_amount),
            "currency": "CAD",
        }

    def __repr__(self) -> str:
        return (
            f"TaxCalculation(subtotal={self.subtotal}, "
            f"province={self.province}, tax={self.total_tax}, "
            f"total={self.total_amount})"
        )


class CanadianTaxService:
    """
    Canadian tax calculation and compliance service
    """

    def __init__(self, session: AsyncSession):
        """
        Initialize tax service

        Args:
            session: SQLAlchemy async session
        """
        self.session = session

    async def get_tax_rate(
        self,
        province: CanadianProvince,
        effective_date: Optional[date] = None,
    ) -> Optional[CanadianTaxRate]:
        """
        Get tax rate for province

        Args:
            province: Canadian province code
            effective_date: Date to check (defaults to today)

        Returns:
            CanadianTaxRate or None
        """
        if effective_date is None:
            effective_date = date.today()

        # Query for active tax rate
        stmt = select(CanadianTaxRate).where(
            CanadianTaxRate.province == province.value,
            CanadianTaxRate.is_active == True,
            CanadianTaxRate.effective_from <= effective_date,
        )

        # Add effective_to filter if not null
        stmt = stmt.where(
            (CanadianTaxRate.effective_to == None)
            | (CanadianTaxRate.effective_to >= effective_date)
        )

        result = await self.session.execute(stmt)
        tax_rate = result.scalar_one_or_none()

        if not tax_rate:
            logger.warning(f"No tax rate found for province {province.value}")

        return tax_rate

    async def calculate_tax(
        self,
        subtotal: Decimal,
        province: CanadianProvince,
        effective_date: Optional[date] = None,
    ) -> Optional[TaxCalculationResult]:
        """
        Calculate tax for amount and province

        Args:
            subtotal: Subtotal amount in CAD
            province: Canadian province code
            effective_date: Date to check (defaults to today)

        Returns:
            TaxCalculationResult or None
        """
        # Get tax rate
        tax_rate = await self.get_tax_rate(province, effective_date)

        if not tax_rate:
            return None

        # Calculate tax
        result = TaxCalculationResult(
            subtotal=subtotal,
            province=province,
            tax_rate=tax_rate,
        )

        logger.info(
            f"Calculated tax for {province.value}: "
            f"subtotal={subtotal}, tax={result.total_tax}, "
            f"total={result.total_amount}"
        )

        return result

    async def get_all_tax_rates(self) -> Dict[str, CanadianTaxRate]:
        """
        Get all active tax rates

        Returns:
            Dictionary mapping province codes to tax rates
        """
        stmt = select(CanadianTaxRate).where(
            CanadianTaxRate.is_active == True,
            CanadianTaxRate.effective_to == None,
        )

        result = await self.session.execute(stmt)
        tax_rates = result.scalars().all()

        return {rate.province: rate for rate in tax_rates}

    async def validate_province(self, province_code: str) -> bool:
        """
        Validate Canadian province code

        Args:
            province_code: Province code to validate

        Returns:
            True if valid, False otherwise
        """
        try:
            CanadianProvince(province_code.upper())
            return True
        except ValueError:
            return False

    def format_tax_receipt(
        self, calculation: TaxCalculationResult
    ) -> Dict:
        """
        Format tax calculation for receipt/invoice display

        Args:
            calculation: TaxCalculationResult

        Returns:
            Formatted tax receipt data
        """
        receipt = {
            "subtotal": {
                "label": "Subtotal",
                "amount": float(calculation.subtotal),
                "currency": "CAD",
            },
            "taxes": [],
            "total": {
                "label": "Total",
                "amount": float(calculation.total_amount),
                "currency": "CAD",
            },
        }

        # Add tax line items based on tax type
        if calculation.gst_amount > 0:
            receipt["taxes"].append({
                "label": f"GST ({float(calculation.tax_rate_data.gst_rate * 100):.2f}%)",
                "amount": float(calculation.gst_amount),
                "currency": "CAD",
            })

        if calculation.pst_amount > 0:
            receipt["taxes"].append({
                "label": f"PST ({float(calculation.tax_rate_data.pst_rate * 100):.2f}%)",
                "amount": float(calculation.pst_amount),
                "currency": "CAD",
            })

        if calculation.hst_amount > 0:
            receipt["taxes"].append({
                "label": f"HST ({float(calculation.tax_rate_data.hst_rate * 100):.2f}%)",
                "amount": float(calculation.hst_amount),
                "currency": "CAD",
            })

        if calculation.qst_amount > 0:
            receipt["taxes"].append({
                "label": f"QST ({float(calculation.tax_rate_data.qst_rate * 100):.2f}%)",
                "amount": float(calculation.qst_amount),
                "currency": "CAD",
            })

        return receipt

    def get_provincial_tax_info(
        self, province: CanadianProvince
    ) -> Dict:
        """
        Get tax information for province (for UI display)

        Args:
            province: Canadian province code

        Returns:
            Tax information dictionary
        """
        # Provincial tax information (as of 2025)
        tax_info = {
            CanadianProvince.ON: {
                "name": "Ontario",
                "tax_type": "HST",
                "rate": 0.13,
                "description": "Harmonized Sales Tax (13%)",
            },
            CanadianProvince.QC: {
                "name": "Quebec",
                "tax_type": "GST+QST",
                "rate": 0.14975,
                "description": "GST (5%) + QST (9.975%)",
            },
            CanadianProvince.BC: {
                "name": "British Columbia",
                "tax_type": "GST+PST",
                "rate": 0.12,
                "description": "GST (5%) + PST (7%)",
            },
            CanadianProvince.AB: {
                "name": "Alberta",
                "tax_type": "GST",
                "rate": 0.05,
                "description": "GST only (5%)",
            },
            CanadianProvince.SK: {
                "name": "Saskatchewan",
                "tax_type": "GST+PST",
                "rate": 0.11,
                "description": "GST (5%) + PST (6%)",
            },
            CanadianProvince.MB: {
                "name": "Manitoba",
                "tax_type": "GST+PST",
                "rate": 0.12,
                "description": "GST (5%) + PST (7%)",
            },
            CanadianProvince.NS: {
                "name": "Nova Scotia",
                "tax_type": "HST",
                "rate": 0.15,
                "description": "Harmonized Sales Tax (15%)",
            },
            CanadianProvince.NB: {
                "name": "New Brunswick",
                "tax_type": "HST",
                "rate": 0.15,
                "description": "Harmonized Sales Tax (15%)",
            },
            CanadianProvince.PE: {
                "name": "Prince Edward Island",
                "tax_type": "HST",
                "rate": 0.15,
                "description": "Harmonized Sales Tax (15%)",
            },
            CanadianProvince.NL: {
                "name": "Newfoundland and Labrador",
                "tax_type": "HST",
                "rate": 0.15,
                "description": "Harmonized Sales Tax (15%)",
            },
            CanadianProvince.NT: {
                "name": "Northwest Territories",
                "tax_type": "GST",
                "rate": 0.05,
                "description": "GST only (5%)",
            },
            CanadianProvince.YT: {
                "name": "Yukon",
                "tax_type": "GST",
                "rate": 0.05,
                "description": "GST only (5%)",
            },
            CanadianProvince.NU: {
                "name": "Nunavut",
                "tax_type": "GST",
                "rate": 0.05,
                "description": "GST only (5%)",
            },
        }

        return tax_info.get(province, {})


# =============================================================================
# Helper Functions
# =============================================================================


def get_tax_service(session: AsyncSession) -> CanadianTaxService:
    """
    Get tax service instance

    Args:
        session: SQLAlchemy async session

    Returns:
        CanadianTaxService instance
    """
    return CanadianTaxService(session)


def format_currency(amount: Decimal, currency: str = "CAD") -> str:
    """
    Format currency for display

    Args:
        amount: Amount to format
        currency: Currency code

    Returns:
        Formatted currency string
    """
    if currency == "CAD":
        return f"${amount:.2f} CAD"
    return f"{amount:.2f} {currency}"


def parse_province_code(province_input: str) -> Optional[CanadianProvince]:
    """
    Parse province code from user input

    Args:
        province_input: Province code input (e.g., "ON", "on", "Ontario")

    Returns:
        CanadianProvince or None
    """
    try:
        return CanadianProvince(province_input.upper())
    except ValueError:
        # Try matching by province name
        province_map = {
            "ontario": CanadianProvince.ON,
            "quebec": CanadianProvince.QC,
            "british columbia": CanadianProvince.BC,
            "alberta": CanadianProvince.AB,
            "saskatchewan": CanadianProvince.SK,
            "manitoba": CanadianProvince.MB,
            "nova scotia": CanadianProvince.NS,
            "new brunswick": CanadianProvince.NB,
            "prince edward island": CanadianProvince.PE,
            "newfoundland and labrador": CanadianProvince.NL,
            "northwest territories": CanadianProvince.NT,
            "yukon": CanadianProvince.YT,
            "nunavut": CanadianProvince.NU,
        }
        return province_map.get(province_input.lower())


# =============================================================================
# Export
# =============================================================================

__all__ = [
    "CanadianTaxService",
    "TaxCalculationResult",
    "get_tax_service",
    "format_currency",
    "parse_province_code",
]
