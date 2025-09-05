"""
Consent Service for NestSync
PIPEDA-compliant consent management and audit trail
"""

import logging
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc

from app.models import User, ConsentRecord, ConsentAuditLog, ConsentType, ConsentStatus
from app.config.settings import settings
from app.auth import RequestContext

logger = logging.getLogger(__name__)


class ConsentService:
    """
    Service class for PIPEDA-compliant consent management
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create_consent_record(
        self,
        user: User,
        consent_type: str,
        purpose: str,
        context: RequestContext,
        **consent_data
    ) -> ConsentRecord:
        """
        Create a new consent record
        """
        consent = ConsentRecord(
            user_id=user.id,
            consent_type=consent_type,
            purpose=purpose,
            consent_version=settings.consent_version,
            legal_basis=consent_data.get("legal_basis", "Consent"),
            ip_address=context.ip_address,
            user_agent=context.user_agent,
            consent_method=consent_data.get("consent_method", "web"),
            jurisdiction="Canada",
            province=user.province,
            **consent_data
        )
        
        self.session.add(consent)
        await self.session.flush()
        
        logger.info(f"Consent record created: {consent.id} for user: {user.id}")
        return consent
    
    async def get_user_consent(
        self,
        user_id: uuid.UUID,
        consent_type: str
    ) -> Optional[ConsentRecord]:
        """
        Get the latest consent record for a specific type
        """
        result = await self.session.execute(
            select(ConsentRecord).where(
                and_(
                    ConsentRecord.user_id == user_id,
                    ConsentRecord.consent_type == consent_type,
                    ConsentRecord.is_deleted == False
                )
            ).order_by(desc(ConsentRecord.created_at)).limit(1)
        )
        return result.scalar_one_or_none()
    
    async def get_user_consents(
        self,
        user_id: uuid.UUID,
        active_only: bool = True
    ) -> List[ConsentRecord]:
        """
        Get all consent records for a user
        """
        query = select(ConsentRecord).where(
            and_(
                ConsentRecord.user_id == user_id,
                ConsentRecord.is_deleted == False
            )
        )
        
        if active_only:
            query = query.where(ConsentRecord.status == ConsentStatus.GRANTED)
        
        query = query.order_by(ConsentRecord.consent_type, desc(ConsentRecord.created_at))
        
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def grant_consent(
        self,
        user: User,
        consent_type: str,
        context: RequestContext,
        consent_version: Optional[str] = None,
        evidence: Optional[Dict[str, Any]] = None
    ) -> ConsentRecord:
        """
        Grant consent with full audit trail
        """
        # Get existing consent record or create new one
        consent = await self.get_user_consent(user.id, consent_type)
        
        if not consent:
            # Create new consent record
            consent = await self.create_consent_record(
                user=user,
                consent_type=consent_type,
                purpose=self._get_consent_purpose(consent_type),
                context=context,
                consent_version=consent_version or settings.consent_version,
                legal_basis="Consent",
                requires_renewal=True,
                renewal_period_months=12
            )
        
        # Record previous status for audit
        previous_status = consent.status
        
        # Grant consent
        consent.grant_consent(context.ip_address, context.user_agent, evidence)
        
        # Create audit log entry
        await self._create_audit_log(
            consent=consent,
            user_id=user.id,
            action="grant",
            previous_status=previous_status,
            new_status=ConsentStatus.GRANTED,
            context=context
        )
        
        # Update user consent fields for quick access
        await self._update_user_consent_fields(user, consent_type, True)
        
        await self.session.commit()
        await self.session.refresh(consent)
        
        logger.info(f"Consent granted: {consent_type} for user: {user.id}")
        return consent
    
    async def withdraw_consent(
        self,
        user: User,
        consent_type: str,
        context: RequestContext,
        reason: Optional[str] = None
    ) -> Optional[ConsentRecord]:
        """
        Withdraw consent with full audit trail
        """
        consent = await self.get_user_consent(user.id, consent_type)
        
        if not consent or consent.status != ConsentStatus.GRANTED:
            logger.warning(f"No active consent to withdraw: {consent_type} for user: {user.id}")
            return None
        
        # Record previous status for audit
        previous_status = consent.status
        
        # Withdraw consent
        consent.withdraw_consent(context.ip_address, context.user_agent, reason)
        
        # Create audit log entry
        await self._create_audit_log(
            consent=consent,
            user_id=user.id,
            action="withdraw",
            previous_status=previous_status,
            new_status=ConsentStatus.WITHDRAWN,
            context=context,
            reason=reason
        )
        
        # Update user consent fields
        await self._update_user_consent_fields(user, consent_type, False)
        
        await self.session.commit()
        await self.session.refresh(consent)
        
        logger.info(f"Consent withdrawn: {consent_type} for user: {user.id}")
        return consent
    
    async def renew_consent(
        self,
        user: User,
        consent_type: str,
        context: RequestContext,
        new_version: Optional[str] = None
    ) -> ConsentRecord:
        """
        Renew consent with new version
        """
        consent = await self.get_user_consent(user.id, consent_type)
        
        if not consent:
            # Create new consent if none exists
            return await self.grant_consent(user, consent_type, context, new_version)
        
        # Record previous status for audit
        previous_status = consent.status
        
        # Renew consent
        consent.renew_consent(
            context.ip_address,
            context.user_agent,
            new_version or settings.consent_version
        )
        
        # Create audit log entry
        await self._create_audit_log(
            consent=consent,
            user_id=user.id,
            action="renew",
            previous_status=previous_status,
            new_status=ConsentStatus.GRANTED,
            context=context
        )
        
        # Update user consent fields
        await self._update_user_consent_fields(user, consent_type, True)
        
        await self.session.commit()
        await self.session.refresh(consent)
        
        logger.info(f"Consent renewed: {consent_type} for user: {user.id}")
        return consent
    
    async def check_consent_renewals(self, user_id: uuid.UUID) -> List[ConsentRecord]:
        """
        Check which consents need renewal
        """
        consents = await self.get_user_consents(user_id, active_only=True)
        
        renewals_needed = []
        for consent in consents:
            if consent.needs_renewal:
                renewals_needed.append(consent)
        
        return renewals_needed
    
    async def expire_consent(
        self,
        consent: ConsentRecord,
        admin_user_id: Optional[uuid.UUID] = None
    ) -> ConsentRecord:
        """
        Expire a consent record (system action)
        """
        previous_status = consent.status
        
        consent.expire_consent()
        
        # Create audit log entry
        await self._create_audit_log(
            consent=consent,
            user_id=admin_user_id or consent.user_id,
            action="expire",
            previous_status=previous_status,
            new_status=ConsentStatus.EXPIRED,
            context=None,
            reason="Automatic expiration"
        )
        
        # Update user consent fields
        await self._update_user_consent_fields_by_id(consent.user_id, consent.consent_type, False)
        
        await self.session.commit()
        
        logger.info(f"Consent expired: {consent.consent_type} for user: {consent.user_id}")
        return consent
    
    async def get_consent_audit_trail(
        self,
        user_id: uuid.UUID,
        consent_type: Optional[str] = None,
        limit: int = 50
    ) -> List[ConsentAuditLog]:
        """
        Get consent audit trail for a user
        """
        query = select(ConsentAuditLog).where(ConsentAuditLog.user_id == user_id)
        
        if consent_type:
            # Join with ConsentRecord to filter by type
            query = query.join(ConsentRecord).where(ConsentRecord.consent_type == consent_type)
        
        query = query.order_by(desc(ConsentAuditLog.created_at)).limit(limit)
        
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def generate_consent_report(self, user_id: uuid.UUID) -> Dict[str, Any]:
        """
        Generate comprehensive consent report for PIPEDA compliance
        """
        consents = await self.get_user_consents(user_id, active_only=False)
        audit_logs = await self.get_consent_audit_trail(user_id)
        
        report = {
            "user_id": str(user_id),
            "generated_at": datetime.now(timezone.utc),
            "consent_summary": {
                "total_consents": len(consents),
                "active_consents": len([c for c in consents if c.is_active]),
                "withdrawn_consents": len([c for c in consents if c.status == ConsentStatus.WITHDRAWN]),
                "expired_consents": len([c for c in consents if c.status == ConsentStatus.EXPIRED])
            },
            "consent_details": [
                {
                    "consent_type": c.consent_type,
                    "status": c.status,
                    "granted_at": c.granted_at,
                    "withdrawn_at": c.withdrawn_at,
                    "expires_at": c.expires_at,
                    "consent_version": c.consent_version,
                    "legal_basis": c.legal_basis,
                    "purpose": c.purpose
                }
                for c in consents
            ],
            "audit_trail_count": len(audit_logs),
            "compliance_status": "compliant"  # Would calculate based on requirements
        }
        
        return report
    
    async def _create_audit_log(
        self,
        consent: ConsentRecord,
        user_id: uuid.UUID,
        action: str,
        previous_status: str,
        new_status: str,
        context: Optional[RequestContext] = None,
        reason: Optional[str] = None
    ) -> ConsentAuditLog:
        """
        Create audit log entry for consent action
        """
        audit_log = ConsentAuditLog(
            consent_record_id=consent.id,
            user_id=user_id,
            action=action,
            previous_status=previous_status,
            new_status=new_status,
            reason=reason,
            ip_address=context.ip_address if context else None,
            user_agent=context.user_agent if context else None,
            retention_until=datetime.now(timezone.utc).replace(year=datetime.now(timezone.utc).year + 7)  # 7 year retention
        )
        
        self.session.add(audit_log)
        return audit_log
    
    async def _update_user_consent_fields(
        self,
        user: User,
        consent_type: str,
        granted: bool
    ) -> None:
        """
        Update user model consent fields for quick access
        """
        if consent_type == ConsentType.MARKETING:
            user.marketing_consent = granted
        elif consent_type == ConsentType.ANALYTICS:
            user.analytics_consent = granted
        elif consent_type == ConsentType.DATA_SHARING:
            user.data_sharing_consent = granted
        elif consent_type == ConsentType.PRIVACY_POLICY:
            user.privacy_policy_accepted = granted
            if granted:
                user.privacy_policy_accepted_at = datetime.now(timezone.utc)
        elif consent_type == ConsentType.TERMS_OF_SERVICE:
            user.terms_of_service_accepted = granted
            if granted:
                user.terms_of_service_accepted_at = datetime.now(timezone.utc)
    
    async def _update_user_consent_fields_by_id(
        self,
        user_id: uuid.UUID,
        consent_type: str,
        granted: bool
    ) -> None:
        """
        Update user model consent fields by user ID
        """
        result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if user:
            await self._update_user_consent_fields(user, consent_type, granted)
    
    def _get_consent_purpose(self, consent_type: str) -> str:
        """
        Get standard purpose text for consent type
        """
        purposes = {
            ConsentType.PRIVACY_POLICY: "Process personal data according to privacy policy",
            ConsentType.TERMS_OF_SERVICE: "Use the NestSync application services",
            ConsentType.MARKETING: "Send marketing communications and product updates",
            ConsentType.ANALYTICS: "Analyze usage patterns to improve the application",
            ConsentType.DATA_SHARING: "Share anonymized data with research partners",
            ConsentType.COOKIES: "Use cookies and similar technologies for functionality",
            ConsentType.LOCATION_TRACKING: "Track location for emergency store finder features",
            ConsentType.BIOMETRIC_DATA: "Use biometric authentication for enhanced security",
            ConsentType.CHILD_DATA: "Process child profile data for diaper planning",
            ConsentType.EMERGENCY_CONTACTS: "Share emergency contact information when needed"
        }
        
        return purposes.get(consent_type, "Process personal data for application functionality")


# =============================================================================
# Export Service
# =============================================================================

__all__ = ["ConsentService"]