"""
GraphQL Emergency Resolvers for NestSync
PIPEDA-compliant emergency information access and management
"""

import logging
import uuid
from datetime import datetime, timezone, date
from typing import Optional, List, Dict, Any
import strawberry
from strawberry.types import Info
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from graphql import GraphQLError

from app.config.database import get_async_session
from app.graphql.context import require_context_user, get_context_user
from app.models import (
    User, Child, Family, FamilyMember,
    EmergencyContact as EmergencyContactModel,
    MedicalInformation as MedicalInformationModel,
    HealthcareProvider as HealthcareProviderModel,
    EmergencyAccess as EmergencyAccessModel,
    EmergencyAuditLog,
    EmergencyAccessAction,
    EmergencyDataType,
    log_emergency_data_access
)
from .emergency_types import (
    EmergencyContact,
    EmergencyContactConnection,
    EmergencyContactResponse,
    CreateEmergencyContactInput,
    UpdateEmergencyContactInput,
    MedicalInformation,
    MedicalInformationResponse,
    UpdateMedicalInformationInput,
    AllergyInfo,
    MedicationInfo,
    MedicalConditionInfo,
    ImmunizationInfo,
    SurgeryProcedureInfo,
    HospitalizationInfo,
    HealthcareProvider,
    HealthcareProviderConnection,
    HealthcareProviderResponse,
    CreateHealthcareProviderInput,
    UpdateHealthcareProviderInput,
    EmergencyAccess,
    EmergencyAccessConnection,
    EmergencyAccessResponse,
    CreateEmergencyAccessInput,
    QRCodeData,
    EmergencyInformation,
    EmergencyInformationResponse,
    HealthCardValidationResult,
    BloodTypeEnum,
    HealthCardProvinceEnum,
    ProviderTypeEnum
)

logger = logging.getLogger(__name__)


# =============================================================================
# Helper Functions
# =============================================================================

def emergency_contact_to_graphql(contact: EmergencyContactModel) -> EmergencyContact:
    """Convert EmergencyContact model to GraphQL type"""
    return EmergencyContact(
        id=str(contact.id),
        child_id=str(contact.child_id),
        family_id=str(contact.family_id),
        name=contact.name,
        relationship=contact.relationship_to_child,
        phone_primary=contact.phone_primary,
        phone_secondary=contact.phone_secondary,
        email=contact.email,
        is_primary=contact.is_primary,
        priority_order=contact.priority_order,
        address=contact.address,
        notes=contact.notes,
        can_pickup=contact.can_pickup,
        can_make_medical_decisions=contact.can_make_medical_decisions,
        province=contact.province,
        speaks_french=contact.speaks_french,
        speaks_english=contact.speaks_english,
        last_verified_at=contact.last_verified_at,
        consent_given_at=contact.consent_given_at,
        created_at=contact.created_at,
        updated_at=contact.updated_at
    )


def medical_info_to_graphql(medical: MedicalInformationModel) -> MedicalInformation:
    """Convert MedicalInformation model to GraphQL type"""
    # Convert JSON fields to GraphQL types
    allergies = []
    if medical.allergies:
        for allergy_data in medical.allergies:
            allergies.append(AllergyInfo(
                allergen=allergy_data.get("allergen", ""),
                severity=allergy_data.get("severity", "unknown"),
                reaction=allergy_data.get("reaction"),
                treatment=allergy_data.get("treatment"),
                verified_date=allergy_data.get("verified_date")
            ))

    medications = []
    if medical.medications:
        for med_data in medical.medications:
            medications.append(MedicationInfo(
                name=med_data.get("name", ""),
                dosage=med_data.get("dosage", ""),
                frequency=med_data.get("frequency", ""),
                prescribing_doctor=med_data.get("prescribing_doctor"),
                start_date=med_data.get("start_date"),
                end_date=med_data.get("end_date"),
                notes=med_data.get("notes")
            ))

    conditions = []
    if medical.medical_conditions:
        for condition_data in medical.medical_conditions:
            conditions.append(MedicalConditionInfo(
                condition=condition_data.get("condition", ""),
                diagnosed_date=condition_data.get("diagnosed_date"),
                severity=condition_data.get("severity", "moderate"),
                treatment_plan=condition_data.get("treatment_plan"),
                monitoring_required=condition_data.get("monitoring_required", False)
            ))

    immunizations = []
    if medical.immunizations:
        for imm_data in medical.immunizations:
            immunizations.append(ImmunizationInfo(
                vaccine=imm_data.get("vaccine", ""),
                date_given=imm_data.get("date_given", ""),
                dose_number=imm_data.get("dose_number", 1),
                next_dose_due=imm_data.get("next_dose_due"),
                administered_by=imm_data.get("administered_by")
            ))

    surgeries = []
    if medical.surgeries_procedures:
        for surgery_data in medical.surgeries_procedures:
            surgeries.append(SurgeryProcedureInfo(
                procedure=surgery_data.get("procedure", ""),
                date=surgery_data.get("date", ""),
                hospital=surgery_data.get("hospital"),
                surgeon=surgery_data.get("surgeon"),
                notes=surgery_data.get("notes")
            ))

    hospitalizations = []
    if medical.hospitalizations:
        for hosp_data in medical.hospitalizations:
            hospitalizations.append(HospitalizationInfo(
                reason=hosp_data.get("reason", ""),
                admission_date=hosp_data.get("admission_date", ""),
                discharge_date=hosp_data.get("discharge_date"),
                hospital=hosp_data.get("hospital"),
                attending_physician=hosp_data.get("attending_physician"),
                notes=hosp_data.get("notes")
            ))

    return MedicalInformation(
        id=str(medical.id),
        child_id=str(medical.child_id),
        family_id=str(medical.family_id),
        blood_type=BloodTypeEnum(medical.blood_type) if medical.blood_type else None,
        allergies=allergies,
        has_epipen=medical.has_epipen,
        medications=medications,
        medical_conditions=conditions,
        health_card_number=medical.health_card_number,
        health_card_province=HealthCardProvinceEnum(medical.health_card_province) if medical.health_card_province else None,
        health_card_expiry=medical.health_card_expiry,
        health_card_version=medical.health_card_version,
        immunizations=immunizations,
        emergency_notes=medical.emergency_notes,
        special_instructions=medical.special_instructions,
        medical_devices=medical.medical_devices or [],
        private_insurance_provider=medical.private_insurance_provider,
        private_insurance_number=medical.private_insurance_number,
        surgeries_procedures=surgeries,
        hospitalizations=hospitalizations,
        last_updated_by=str(medical.last_updated_by) if medical.last_updated_by else None,
        last_verified_at=medical.last_verified_at,
        consent_to_share_with_providers=medical.consent_to_share_with_providers,
        created_at=medical.created_at,
        updated_at=medical.updated_at
    )


def healthcare_provider_to_graphql(provider: HealthcareProviderModel) -> HealthcareProvider:
    """Convert HealthcareProvider model to GraphQL type"""
    return HealthcareProvider(
        id=str(provider.id),
        child_id=str(provider.child_id),
        family_id=str(provider.family_id),
        provider_type=ProviderTypeEnum(provider.provider_type),
        is_primary=provider.is_primary,
        provider_name=provider.provider_name,
        clinic_name=provider.clinic_name,
        specialty=provider.specialty,
        phone=provider.phone,
        phone_emergency=provider.phone_emergency,
        fax=provider.fax,
        email=provider.email,
        address_line1=provider.address_line1,
        address_line2=provider.address_line2,
        city=provider.city,
        province=provider.province,
        postal_code=provider.postal_code,
        office_hours=provider.office_hours,
        appointment_booking_url=provider.appointment_booking_url,
        patient_portal_url=provider.patient_portal_url,
        notes=provider.notes,
        accepts_provincial_coverage=provider.accepts_provincial_coverage,
        languages_spoken=provider.languages_spoken,
        referral_required=provider.referral_required,
        last_visit_date=provider.last_visit_date,
        next_appointment_date=provider.next_appointment_date,
        patient_id=provider.patient_id,
        created_at=provider.created_at,
        updated_at=provider.updated_at
    )


def emergency_access_to_graphql(access: EmergencyAccessModel) -> EmergencyAccess:
    """Convert EmergencyAccess model to GraphQL type"""
    from .emergency_types import AccessLogEntry

    access_log = []
    if access.access_log:
        for log_entry in access.access_log:
            access_log.append(AccessLogEntry(
                accessed_at=log_entry.get("accessed_at", ""),
                ip_address=log_entry.get("ip_address"),
                user_agent=log_entry.get("user_agent"),
                action=log_entry.get("action", "view"),
                success=log_entry.get("success", False)
            ))

    return EmergencyAccess(
        id=str(access.id),
        family_id=str(access.family_id),
        child_id=str(access.child_id) if access.child_id else None,
        created_by=str(access.created_by),
        access_token=access.access_token,
        access_code=access.access_code,
        expires_at=access.expires_at,
        is_active=access.is_active,
        max_uses=access.max_uses,
        use_count=access.use_count,
        can_view_medical=access.can_view_medical,
        can_view_contacts=access.can_view_contacts,
        can_view_providers=access.can_view_providers,
        can_view_location=access.can_view_location,
        recipient_name=access.recipient_name,
        recipient_phone=access.recipient_phone,
        recipient_relationship=access.recipient_relationship,
        purpose=access.purpose,
        notes=access.notes,
        access_log=access_log,
        last_accessed_at=access.last_accessed_at,
        revoked_at=access.revoked_at,
        revoked_by=str(access.revoked_by) if access.revoked_by else None,
        created_at=access.created_at,
        updated_at=access.updated_at
    )


async def verify_family_access(user: User, child_id: str, session: AsyncSession) -> bool:
    """Verify user has access to child through family membership"""
    try:
        # Check if user is a member of the family that owns this child
        result = await session.execute(
            select(FamilyMember)
            .join(Child, Child.family_id == FamilyMember.family_id)
            .where(
                and_(
                    Child.id == uuid.UUID(child_id),
                    FamilyMember.user_id == user.id,
                    FamilyMember.is_active == True,
                    Child.is_deleted == False
                )
            )
        )
        family_member = result.scalar_one_or_none()
        return family_member is not None
    except Exception as e:
        logger.error(f"Error verifying family access: {e}")
        return False


async def log_emergency_access_event(
    session: AsyncSession,
    user_id: str,
    action: str,
    data_type: str,
    child_id: str,
    family_id: str,
    success: bool = True,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    access_reason: Optional[str] = None,
    emergency_situation: bool = False,
    resource_id: Optional[str] = None,
    error_code: Optional[str] = None,
    error_message: Optional[str] = None,
    **kwargs
):
    """Create PIPEDA-compliant audit log for emergency data access"""
    try:
        # Create audit log entry
        audit_log = EmergencyAuditLog.create_access_log(
            action=action,
            data_type=data_type,
            child_id=child_id,
            family_id=family_id,
            success=success,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            access_reason=access_reason,
            emergency_situation=emergency_situation,
            resource_id=resource_id,
            error_code=error_code,
            error_message=error_message,
            **kwargs
        )

        session.add(audit_log)
        await session.commit()

        # Also log to application logs for immediate monitoring
        log_data = {
            "audit_id": str(audit_log.id),
            "user_id": user_id,
            "action": action,
            "data_type": data_type,
            "child_id": child_id,
            "success": success,
            "emergency_situation": emergency_situation,
            "compliance_framework": "PIPEDA"
        }

        if success:
            logger.info(f"Emergency access: {action} on {data_type}", extra=log_data)
        else:
            logger.warning(f"Emergency access denied: {action} on {data_type}", extra=log_data)

        return audit_log

    except Exception as e:
        logger.error(f"Failed to create emergency audit log: {e}")
        # Fallback to basic logging
        if success:
            logger.info(f"Emergency access: {action} on {data_type} (audit failed)")
        else:
            logger.warning(f"Emergency access denied: {action} on {data_type} (audit failed)")
        raise


# =============================================================================
# Emergency Queries
# =============================================================================

@strawberry.type
class EmergencyQueries:
    """Emergency information queries"""

    @strawberry.field
    async def get_emergency_contacts(
        self,
        info: Info,
        child_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> EmergencyContactConnection:
        """Get emergency contacts for a child"""
        try:
            user = await require_context_user(info)
            audit_context = await info.context.get_audit_context()

            async for session in get_async_session():
                # Verify access
                has_access = await verify_family_access(user, child_id, session)
                if not has_access:
                    await log_emergency_access(
                        user_id=str(user.id),
                        action="get_emergency_contacts",
                        resource="emergency_contacts",
                        child_id=child_id,
                        ip_address=audit_context.get("ip_address"),
                        user_agent=audit_context.get("user_agent"),
                        success=False
                    )
                    raise GraphQLError("Access denied to child emergency contacts")

                # Query emergency contacts
                result = await session.execute(
                    select(EmergencyContactModel)
                    .where(
                        and_(
                            EmergencyContactModel.child_id == uuid.UUID(child_id),
                            EmergencyContactModel.family_id.in_(
                                select(FamilyMember.family_id)
                                .where(
                                    and_(
                                        FamilyMember.user_id == user.id,
                                        FamilyMember.is_active == True
                                    )
                                )
                            )
                        )
                    )
                    .order_by(EmergencyContactModel.priority_order, EmergencyContactModel.is_primary.desc())
                    .offset(offset)
                    .limit(limit)
                )
                contacts = result.scalars().all()

                # Count total contacts
                count_result = await session.execute(
                    select(func.count(EmergencyContactModel.id))
                    .where(
                        and_(
                            EmergencyContactModel.child_id == uuid.UUID(child_id),
                            EmergencyContactModel.family_id.in_(
                                select(FamilyMember.family_id)
                                .where(
                                    and_(
                                        FamilyMember.user_id == user.id,
                                        FamilyMember.is_active == True
                                    )
                                )
                            )
                        )
                    )
                )
                total_count = count_result.scalar()

                # Log successful access
                await log_emergency_access(
                    user_id=str(user.id),
                    action="get_emergency_contacts",
                    resource="emergency_contacts",
                    child_id=child_id,
                    ip_address=audit_context.get("ip_address"),
                    user_agent=audit_context.get("user_agent"),
                    success=True
                )

                return EmergencyContactConnection(
                    edges=[emergency_contact_to_graphql(contact) for contact in contacts],
                    total_count=total_count
                )

        except GraphQLError:
            raise
        except Exception as e:
            logger.error(f"Error getting emergency contacts: {e}")
            raise GraphQLError("Failed to get emergency contacts")

    @strawberry.field
    async def get_medical_information(
        self,
        info: Info,
        child_id: str
    ) -> Optional[MedicalInformation]:
        """Get medical information for a child"""
        try:
            user = await require_context_user(info)
            audit_context = await info.context.get_audit_context()

            async for session in get_async_session():
                # Verify access
                has_access = await verify_family_access(user, child_id, session)
                if not has_access:
                    await log_emergency_access(
                        user_id=str(user.id),
                        action="get_medical_information",
                        resource="medical_information",
                        child_id=child_id,
                        ip_address=audit_context.get("ip_address"),
                        user_agent=audit_context.get("user_agent"),
                        success=False
                    )
                    raise GraphQLError("Access denied to child medical information")

                # Query medical information
                result = await session.execute(
                    select(MedicalInformationModel)
                    .where(
                        and_(
                            MedicalInformationModel.child_id == uuid.UUID(child_id),
                            MedicalInformationModel.family_id.in_(
                                select(FamilyMember.family_id)
                                .where(
                                    and_(
                                        FamilyMember.user_id == user.id,
                                        FamilyMember.is_active == True
                                    )
                                )
                            )
                        )
                    )
                )
                medical_info = result.scalar_one_or_none()

                if medical_info:
                    # Log successful access
                    await log_emergency_access(
                        user_id=str(user.id),
                        action="get_medical_information",
                        resource="medical_information",
                        child_id=child_id,
                        ip_address=audit_context.get("ip_address"),
                        user_agent=audit_context.get("user_agent"),
                        success=True
                    )
                    return medical_info_to_graphql(medical_info)

                return None

        except GraphQLError:
            raise
        except Exception as e:
            logger.error(f"Error getting medical information: {e}")
            raise GraphQLError("Failed to get medical information")

    @strawberry.field
    async def get_healthcare_providers(
        self,
        info: Info,
        child_id: str,
        provider_type: Optional[ProviderTypeEnum] = None,
        limit: int = 50,
        offset: int = 0
    ) -> HealthcareProviderConnection:
        """Get healthcare providers for a child"""
        try:
            user = await require_context_user(info)
            audit_context = await info.context.get_audit_context()

            async for session in get_async_session():
                # Verify access
                has_access = await verify_family_access(user, child_id, session)
                if not has_access:
                    await log_emergency_access(
                        user_id=str(user.id),
                        action="get_healthcare_providers",
                        resource="healthcare_providers",
                        child_id=child_id,
                        ip_address=audit_context.get("ip_address"),
                        user_agent=audit_context.get("user_agent"),
                        success=False
                    )
                    raise GraphQLError("Access denied to child healthcare providers")

                # Build query
                query = select(HealthcareProviderModel).where(
                    and_(
                        HealthcareProviderModel.child_id == uuid.UUID(child_id),
                        HealthcareProviderModel.family_id.in_(
                            select(FamilyMember.family_id)
                            .where(
                                and_(
                                    FamilyMember.user_id == user.id,
                                    FamilyMember.is_active == True
                                )
                            )
                        )
                    )
                )

                if provider_type:
                    query = query.where(HealthcareProviderModel.provider_type == provider_type.value)

                # Execute query
                result = await session.execute(
                    query.order_by(HealthcareProviderModel.is_primary.desc(), HealthcareProviderModel.provider_name)
                    .offset(offset)
                    .limit(limit)
                )
                providers = result.scalars().all()

                # Count total providers
                count_query = select(func.count(HealthcareProviderModel.id)).where(
                    and_(
                        HealthcareProviderModel.child_id == uuid.UUID(child_id),
                        HealthcareProviderModel.family_id.in_(
                            select(FamilyMember.family_id)
                            .where(
                                and_(
                                    FamilyMember.user_id == user.id,
                                    FamilyMember.is_active == True
                                )
                            )
                        )
                    )
                )

                if provider_type:
                    count_query = count_query.where(HealthcareProviderModel.provider_type == provider_type.value)

                count_result = await session.execute(count_query)
                total_count = count_result.scalar()

                # Log successful access
                await log_emergency_access(
                    user_id=str(user.id),
                    action="get_healthcare_providers",
                    resource="healthcare_providers",
                    child_id=child_id,
                    ip_address=audit_context.get("ip_address"),
                    user_agent=audit_context.get("user_agent"),
                    success=True
                )

                return HealthcareProviderConnection(
                    edges=[healthcare_provider_to_graphql(provider) for provider in providers],
                    total_count=total_count
                )

        except GraphQLError:
            raise
        except Exception as e:
            logger.error(f"Error getting healthcare providers: {e}")
            raise GraphQLError("Failed to get healthcare providers")

    @strawberry.field
    async def get_emergency_information(
        self,
        info: Info,
        child_id: str
    ) -> EmergencyInformationResponse:
        """Get complete emergency information for a child"""
        try:
            user = await require_context_user(info)
            audit_context = await info.context.get_audit_context()

            async for session in get_async_session():
                # Verify access
                has_access = await verify_family_access(user, child_id, session)
                if not has_access:
                    await log_emergency_access(
                        user_id=str(user.id),
                        action="get_emergency_information",
                        resource="emergency_information",
                        child_id=child_id,
                        ip_address=audit_context.get("ip_address"),
                        user_agent=audit_context.get("user_agent"),
                        success=False
                    )
                    return EmergencyInformationResponse(
                        success=False,
                        message="Access denied to child emergency information",
                        errors=["Access denied"]
                    )

                # Get child information
                child_result = await session.execute(
                    select(Child)
                    .where(
                        and_(
                            Child.id == uuid.UUID(child_id),
                            Child.is_deleted == False
                        )
                    )
                )
                child = child_result.scalar_one_or_none()

                if not child:
                    return EmergencyInformationResponse(
                        success=False,
                        message="Child not found",
                        errors=["Child not found"]
                    )

                # Get emergency contacts
                contacts_result = await session.execute(
                    select(EmergencyContactModel)
                    .where(EmergencyContactModel.child_id == uuid.UUID(child_id))
                    .order_by(EmergencyContactModel.priority_order, EmergencyContactModel.is_primary.desc())
                )
                contacts = contacts_result.scalars().all()

                # Get medical information
                medical_result = await session.execute(
                    select(MedicalInformationModel)
                    .where(MedicalInformationModel.child_id == uuid.UUID(child_id))
                )
                medical_info = medical_result.scalar_one_or_none()

                # Get healthcare providers
                providers_result = await session.execute(
                    select(HealthcareProviderModel)
                    .where(HealthcareProviderModel.child_id == uuid.UUID(child_id))
                    .order_by(HealthcareProviderModel.is_primary.desc(), HealthcareProviderModel.provider_name)
                )
                providers = providers_result.scalars().all()

                # Create emergency information
                emergency_info = EmergencyInformation(
                    child_id=str(child.id),
                    child_name=child.name,
                    child_birth_date=child.birth_date,
                    emergency_contacts=[emergency_contact_to_graphql(contact) for contact in contacts],
                    medical_information=medical_info_to_graphql(medical_info) if medical_info else None,
                    healthcare_providers=[healthcare_provider_to_graphql(provider) for provider in providers],
                    last_updated=datetime.now(timezone.utc)
                )

                # Log successful access
                await log_emergency_access(
                    user_id=str(user.id),
                    action="get_emergency_information",
                    resource="emergency_information",
                    child_id=child_id,
                    ip_address=audit_context.get("ip_address"),
                    user_agent=audit_context.get("user_agent"),
                    success=True
                )

                return EmergencyInformationResponse(
                    success=True,
                    message="Emergency information retrieved successfully",
                    emergency_information=emergency_info
                )

        except GraphQLError:
            raise
        except Exception as e:
            logger.error(f"Error getting emergency information: {e}")
            return EmergencyInformationResponse(
                success=False,
                message="Failed to get emergency information",
                errors=[str(e)]
            )

    @strawberry.field
    async def get_emergency_access_tokens(
        self,
        info: Info,
        child_id: Optional[str] = None,
        active_only: bool = True,
        limit: int = 50,
        offset: int = 0
    ) -> EmergencyAccessConnection:
        """Get emergency access tokens created by the user"""
        try:
            user = await require_context_user(info)

            async for session in get_async_session():
                # Build query conditions
                conditions = [EmergencyAccessModel.created_by == user.id]

                if child_id:
                    # Verify access to the specific child
                    has_access = await verify_family_access(user, child_id, session)
                    if not has_access:
                        raise GraphQLError("Access denied to child emergency access tokens")
                    conditions.append(EmergencyAccessModel.child_id == uuid.UUID(child_id))
                else:
                    # Only show tokens for families the user is a member of
                    conditions.append(
                        EmergencyAccessModel.family_id.in_(
                            select(FamilyMember.family_id)
                            .where(
                                and_(
                                    FamilyMember.user_id == user.id,
                                    FamilyMember.is_active == True
                                )
                            )
                        )
                    )

                if active_only:
                    conditions.append(EmergencyAccessModel.is_active == True)
                    conditions.append(EmergencyAccessModel.expires_at > datetime.now(timezone.utc))

                # Query tokens
                result = await session.execute(
                    select(EmergencyAccessModel)
                    .where(and_(*conditions))
                    .order_by(EmergencyAccessModel.created_at.desc())
                    .offset(offset)
                    .limit(limit)
                )
                tokens = result.scalars().all()

                # Count total tokens
                count_result = await session.execute(
                    select(func.count(EmergencyAccessModel.id))
                    .where(and_(*conditions))
                )
                total_count = count_result.scalar()

                return EmergencyAccessConnection(
                    edges=[emergency_access_to_graphql(token) for token in tokens],
                    total_count=total_count
                )

        except GraphQLError:
            raise
        except Exception as e:
            logger.error(f"Error getting emergency access tokens: {e}")
            raise GraphQLError("Failed to get emergency access tokens")


# =============================================================================
# Emergency Mutations
# =============================================================================

@strawberry.type
class EmergencyMutations:
    """Emergency information mutations"""

    @strawberry.mutation
    async def create_emergency_contact(
        self,
        info: Info,
        input: CreateEmergencyContactInput
    ) -> EmergencyContactResponse:
        """Create a new emergency contact for a child"""
        try:
            user = await require_context_user(info)
            audit_context = await info.context.get_audit_context()

            async for session in get_async_session():
                # Verify access to child
                has_access = await verify_family_access(user, input.child_id, session)
                if not has_access:
                    await log_emergency_access(
                        user_id=str(user.id),
                        action="create_emergency_contact",
                        resource="emergency_contacts",
                        child_id=input.child_id,
                        ip_address=audit_context.get("ip_address"),
                        user_agent=audit_context.get("user_agent"),
                        success=False
                    )
                    return EmergencyContactResponse(
                        success=False,
                        message="Access denied to create emergency contact",
                        errors=["Access denied"]
                    )

                # Get family_id from child
                child_result = await session.execute(
                    select(Child.family_id)
                    .where(
                        and_(
                            Child.id == uuid.UUID(input.child_id),
                            Child.is_deleted == False
                        )
                    )
                )
                family_id = child_result.scalar_one_or_none()

                if not family_id:
                    return EmergencyContactResponse(
                        success=False,
                        message="Child not found",
                        errors=["Child not found"]
                    )

                # Create emergency contact
                contact = EmergencyContactModel(
                    id=uuid.uuid4(),
                    child_id=uuid.UUID(input.child_id),
                    family_id=family_id,
                    name=input.name,
                    relationship_to_child=input.relationship,
                    phone_primary=input.phone_primary,
                    phone_secondary=input.phone_secondary,
                    email=input.email,
                    is_primary=input.is_primary,
                    priority_order=input.priority_order,
                    address=input.address,
                    notes=input.notes,
                    can_pickup=input.can_pickup,
                    can_make_medical_decisions=input.can_make_medical_decisions,
                    province=input.province,
                    speaks_french=input.speaks_french,
                    speaks_english=input.speaks_english,
                    consent_given_at=datetime.now(timezone.utc),
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )

                session.add(contact)
                await session.commit()
                await session.refresh(contact)

                # Log successful creation
                await log_emergency_access(
                    user_id=str(user.id),
                    action="create_emergency_contact",
                    resource="emergency_contacts",
                    child_id=input.child_id,
                    ip_address=audit_context.get("ip_address"),
                    user_agent=audit_context.get("user_agent"),
                    success=True
                )

                return EmergencyContactResponse(
                    success=True,
                    message="Emergency contact created successfully",
                    emergency_contact=emergency_contact_to_graphql(contact)
                )

        except GraphQLError:
            raise
        except Exception as e:
            logger.error(f"Error creating emergency contact: {e}")
            return EmergencyContactResponse(
                success=False,
                message="Failed to create emergency contact",
                errors=[str(e)]
            )

    @strawberry.mutation
    async def update_emergency_contact(
        self,
        info: Info,
        input: UpdateEmergencyContactInput
    ) -> EmergencyContactResponse:
        """Update an existing emergency contact"""
        try:
            user = await require_context_user(info)
            audit_context = await info.context.get_audit_context()

            async for session in get_async_session():
                # Get existing contact and verify access
                result = await session.execute(
                    select(EmergencyContactModel)
                    .where(
                        and_(
                            EmergencyContactModel.id == uuid.UUID(input.id),
                            EmergencyContactModel.family_id.in_(
                                select(FamilyMember.family_id)
                                .where(
                                    and_(
                                        FamilyMember.user_id == user.id,
                                        FamilyMember.is_active == True
                                    )
                                )
                            )
                        )
                    )
                )
                contact = result.scalar_one_or_none()

                if not contact:
                    await log_emergency_access(
                        user_id=str(user.id),
                        action="update_emergency_contact",
                        resource="emergency_contacts",
                        ip_address=audit_context.get("ip_address"),
                        user_agent=audit_context.get("user_agent"),
                        success=False
                    )
                    return EmergencyContactResponse(
                        success=False,
                        message="Emergency contact not found or access denied",
                        errors=["Contact not found"]
                    )

                # Update fields
                if input.name is not None:
                    contact.name = input.name
                if input.relationship is not None:
                    contact.relationship_to_child = input.relationship
                if input.phone_primary is not None:
                    contact.phone_primary = input.phone_primary
                if input.phone_secondary is not None:
                    contact.phone_secondary = input.phone_secondary
                if input.email is not None:
                    contact.email = input.email
                if input.is_primary is not None:
                    contact.is_primary = input.is_primary
                if input.priority_order is not None:
                    contact.priority_order = input.priority_order
                if input.address is not None:
                    contact.address = input.address
                if input.notes is not None:
                    contact.notes = input.notes
                if input.can_pickup is not None:
                    contact.can_pickup = input.can_pickup
                if input.can_make_medical_decisions is not None:
                    contact.can_make_medical_decisions = input.can_make_medical_decisions
                if input.province is not None:
                    contact.province = input.province
                if input.speaks_french is not None:
                    contact.speaks_french = input.speaks_french
                if input.speaks_english is not None:
                    contact.speaks_english = input.speaks_english

                contact.updated_at = datetime.now(timezone.utc)

                await session.commit()
                await session.refresh(contact)

                # Log successful update
                await log_emergency_access(
                    user_id=str(user.id),
                    action="update_emergency_contact",
                    resource="emergency_contacts",
                    child_id=str(contact.child_id),
                    ip_address=audit_context.get("ip_address"),
                    user_agent=audit_context.get("user_agent"),
                    success=True
                )

                return EmergencyContactResponse(
                    success=True,
                    message="Emergency contact updated successfully",
                    emergency_contact=emergency_contact_to_graphql(contact)
                )

        except GraphQLError:
            raise
        except Exception as e:
            logger.error(f"Error updating emergency contact: {e}")
            return EmergencyContactResponse(
                success=False,
                message="Failed to update emergency contact",
                errors=[str(e)]
            )

    @strawberry.mutation
    async def delete_emergency_contact(
        self,
        info: Info,
        contact_id: str
    ) -> EmergencyContactResponse:
        """Delete an emergency contact"""
        try:
            user = await require_context_user(info)
            audit_context = await info.context.get_audit_context()

            async for session in get_async_session():
                # Get existing contact and verify access
                result = await session.execute(
                    select(EmergencyContactModel)
                    .where(
                        and_(
                            EmergencyContactModel.id == uuid.UUID(contact_id),
                            EmergencyContactModel.family_id.in_(
                                select(FamilyMember.family_id)
                                .where(
                                    and_(
                                        FamilyMember.user_id == user.id,
                                        FamilyMember.is_active == True
                                    )
                                )
                            )
                        )
                    )
                )
                contact = result.scalar_one_or_none()

                if not contact:
                    return EmergencyContactResponse(
                        success=False,
                        message="Emergency contact not found or access denied",
                        errors=["Contact not found"]
                    )

                await session.delete(contact)
                await session.commit()

                # Log successful deletion
                await log_emergency_access(
                    user_id=str(user.id),
                    action="delete_emergency_contact",
                    resource="emergency_contacts",
                    child_id=str(contact.child_id),
                    ip_address=audit_context.get("ip_address"),
                    user_agent=audit_context.get("user_agent"),
                    success=True
                )

                return EmergencyContactResponse(
                    success=True,
                    message="Emergency contact deleted successfully"
                )

        except GraphQLError:
            raise
        except Exception as e:
            logger.error(f"Error deleting emergency contact: {e}")
            return EmergencyContactResponse(
                success=False,
                message="Failed to delete emergency contact",
                errors=[str(e)]
            )

    @strawberry.mutation
    async def update_medical_information(
        self,
        info: Info,
        input: UpdateMedicalInformationInput
    ) -> MedicalInformationResponse:
        """Update medical information for a child"""
        try:
            user = await require_context_user(info)
            audit_context = await info.context.get_audit_context()

            async for session in get_async_session():
                # Verify access to child
                has_access = await verify_family_access(user, input.child_id, session)
                if not has_access:
                    await log_emergency_access(
                        user_id=str(user.id),
                        action="update_medical_information",
                        resource="medical_information",
                        child_id=input.child_id,
                        ip_address=audit_context.get("ip_address"),
                        user_agent=audit_context.get("user_agent"),
                        success=False
                    )
                    return MedicalInformationResponse(
                        success=False,
                        message="Access denied to update medical information",
                        errors=["Access denied"]
                    )

                # Get existing medical information or create new
                result = await session.execute(
                    select(MedicalInformationModel)
                    .where(MedicalInformationModel.child_id == uuid.UUID(input.child_id))
                )
                medical_info = result.scalar_one_or_none()

                if not medical_info:
                    # Get family_id from child
                    child_result = await session.execute(
                        select(Child.family_id)
                        .where(
                            and_(
                                Child.id == uuid.UUID(input.child_id),
                                Child.is_deleted == False
                            )
                        )
                    )
                    family_id = child_result.scalar_one_or_none()

                    if not family_id:
                        return MedicalInformationResponse(
                            success=False,
                            message="Child not found",
                            errors=["Child not found"]
                        )

                    # Create new medical information
                    medical_info = MedicalInformationModel(
                        id=uuid.uuid4(),
                        child_id=uuid.UUID(input.child_id),
                        family_id=family_id,
                        created_at=datetime.now(timezone.utc),
                        updated_at=datetime.now(timezone.utc)
                    )
                    session.add(medical_info)

                # Update fields
                if input.blood_type is not None:
                    medical_info.blood_type = input.blood_type.value
                if input.health_card_number is not None:
                    medical_info.health_card_number = input.health_card_number
                if input.health_card_province is not None:
                    medical_info.health_card_province = input.health_card_province.value
                if input.health_card_expiry is not None:
                    medical_info.health_card_expiry = datetime.fromisoformat(input.health_card_expiry).date()
                if input.health_card_version is not None:
                    medical_info.health_card_version = input.health_card_version
                if input.emergency_notes is not None:
                    medical_info.emergency_notes = input.emergency_notes
                if input.special_instructions is not None:
                    medical_info.special_instructions = input.special_instructions
                if input.private_insurance_provider is not None:
                    medical_info.private_insurance_provider = input.private_insurance_provider
                if input.private_insurance_number is not None:
                    medical_info.private_insurance_number = input.private_insurance_number
                if input.consent_to_share_with_providers is not None:
                    medical_info.consent_to_share_with_providers = input.consent_to_share_with_providers
                if input.medical_devices is not None:
                    medical_info.medical_devices = input.medical_devices

                # Update JSON fields
                if input.allergies is not None:
                    medical_info.allergies = [
                        {
                            "allergen": allergy.allergen,
                            "severity": allergy.severity,
                            "reaction": allergy.reaction,
                            "treatment": allergy.treatment,
                            "verified_date": date.today().isoformat()
                        }
                        for allergy in input.allergies
                    ]

                if input.medications is not None:
                    medical_info.medications = [
                        {
                            "name": med.name,
                            "dosage": med.dosage,
                            "frequency": med.frequency,
                            "prescribing_doctor": med.prescribing_doctor,
                            "notes": med.notes,
                            "start_date": date.today().isoformat()
                        }
                        for med in input.medications
                    ]

                if input.medical_conditions is not None:
                    medical_info.medical_conditions = [
                        {
                            "condition": condition.condition,
                            "severity": condition.severity,
                            "treatment_plan": condition.treatment_plan,
                            "diagnosed_date": date.today().isoformat(),
                            "monitoring_required": condition.severity in ["severe", "critical"]
                        }
                        for condition in input.medical_conditions
                    ]

                if input.immunizations is not None:
                    medical_info.immunizations = [
                        {
                            "vaccine": imm.vaccine,
                            "date_given": imm.date_given,
                            "dose_number": imm.dose_number,
                            "next_dose_due": imm.next_dose_due,
                            "administered_by": imm.administered_by
                        }
                        for imm in input.immunizations
                    ]

                medical_info.last_updated_by = user.id
                medical_info.last_verified_at = date.today()
                medical_info.updated_at = datetime.now(timezone.utc)

                await session.commit()
                await session.refresh(medical_info)

                # Log successful update
                await log_emergency_access(
                    user_id=str(user.id),
                    action="update_medical_information",
                    resource="medical_information",
                    child_id=input.child_id,
                    ip_address=audit_context.get("ip_address"),
                    user_agent=audit_context.get("user_agent"),
                    success=True
                )

                return MedicalInformationResponse(
                    success=True,
                    message="Medical information updated successfully",
                    medical_information=medical_info_to_graphql(medical_info)
                )

        except GraphQLError:
            raise
        except Exception as e:
            logger.error(f"Error updating medical information: {e}")
            return MedicalInformationResponse(
                success=False,
                message="Failed to update medical information",
                errors=[str(e)]
            )

    @strawberry.mutation
    async def create_healthcare_provider(
        self,
        info: Info,
        input: CreateHealthcareProviderInput
    ) -> HealthcareProviderResponse:
        """Create a new healthcare provider for a child"""
        try:
            user = await require_context_user(info)
            audit_context = await info.context.get_audit_context()

            async for session in get_async_session():
                # Verify access to child
                has_access = await verify_family_access(user, input.child_id, session)
                if not has_access:
                    await log_emergency_access(
                        user_id=str(user.id),
                        action="create_healthcare_provider",
                        resource="healthcare_providers",
                        child_id=input.child_id,
                        ip_address=audit_context.get("ip_address"),
                        user_agent=audit_context.get("user_agent"),
                        success=False
                    )
                    return HealthcareProviderResponse(
                        success=False,
                        message="Access denied to create healthcare provider",
                        errors=["Access denied"]
                    )

                # Get family_id from child
                child_result = await session.execute(
                    select(Child.family_id)
                    .where(
                        and_(
                            Child.id == uuid.UUID(input.child_id),
                            Child.is_deleted == False
                        )
                    )
                )
                family_id = child_result.scalar_one_or_none()

                if not family_id:
                    return HealthcareProviderResponse(
                        success=False,
                        message="Child not found",
                        errors=["Child not found"]
                    )

                # Create healthcare provider
                provider = HealthcareProviderModel(
                    id=uuid.uuid4(),
                    child_id=uuid.UUID(input.child_id),
                    family_id=family_id,
                    provider_type=input.provider_type.value,
                    is_primary=input.is_primary,
                    provider_name=input.provider_name,
                    clinic_name=input.clinic_name,
                    specialty=input.specialty,
                    phone=input.phone,
                    phone_emergency=input.phone_emergency,
                    fax=input.fax,
                    email=input.email,
                    address_line1=input.address_line1,
                    address_line2=input.address_line2,
                    city=input.city,
                    province=input.province,
                    postal_code=input.postal_code,
                    office_hours=input.office_hours,
                    appointment_booking_url=input.appointment_booking_url,
                    patient_portal_url=input.patient_portal_url,
                    notes=input.notes,
                    accepts_provincial_coverage=input.accepts_provincial_coverage,
                    languages_spoken=input.languages_spoken,
                    referral_required=input.referral_required,
                    patient_id=input.patient_id,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )

                session.add(provider)
                await session.commit()
                await session.refresh(provider)

                # Log successful creation
                await log_emergency_access(
                    user_id=str(user.id),
                    action="create_healthcare_provider",
                    resource="healthcare_providers",
                    child_id=input.child_id,
                    ip_address=audit_context.get("ip_address"),
                    user_agent=audit_context.get("user_agent"),
                    success=True
                )

                return HealthcareProviderResponse(
                    success=True,
                    message="Healthcare provider created successfully",
                    healthcare_provider=healthcare_provider_to_graphql(provider)
                )

        except GraphQLError:
            raise
        except Exception as e:
            logger.error(f"Error creating healthcare provider: {e}")
            return HealthcareProviderResponse(
                success=False,
                message="Failed to create healthcare provider",
                errors=[str(e)]
            )

    @strawberry.mutation
    async def update_healthcare_provider(
        self,
        info: Info,
        input: UpdateHealthcareProviderInput
    ) -> HealthcareProviderResponse:
        """Update an existing healthcare provider"""
        try:
            user = await require_context_user(info)
            audit_context = await info.context.get_audit_context()

            async for session in get_async_session():
                # Get existing provider and verify access
                result = await session.execute(
                    select(HealthcareProviderModel)
                    .where(
                        and_(
                            HealthcareProviderModel.id == uuid.UUID(input.id),
                            HealthcareProviderModel.family_id.in_(
                                select(FamilyMember.family_id)
                                .where(
                                    and_(
                                        FamilyMember.user_id == user.id,
                                        FamilyMember.is_active == True
                                    )
                                )
                            )
                        )
                    )
                )
                provider = result.scalar_one_or_none()

                if not provider:
                    await log_emergency_access(
                        user_id=str(user.id),
                        action="update_healthcare_provider",
                        resource="healthcare_providers",
                        ip_address=audit_context.get("ip_address"),
                        user_agent=audit_context.get("user_agent"),
                        success=False
                    )
                    return HealthcareProviderResponse(
                        success=False,
                        message="Healthcare provider not found or access denied",
                        errors=["Provider not found"]
                    )

                # Update fields
                if input.provider_type is not None:
                    provider.provider_type = input.provider_type.value
                if input.is_primary is not None:
                    provider.is_primary = input.is_primary
                if input.provider_name is not None:
                    provider.provider_name = input.provider_name
                if input.clinic_name is not None:
                    provider.clinic_name = input.clinic_name
                if input.specialty is not None:
                    provider.specialty = input.specialty
                if input.phone is not None:
                    provider.phone = input.phone
                if input.phone_emergency is not None:
                    provider.phone_emergency = input.phone_emergency
                if input.fax is not None:
                    provider.fax = input.fax
                if input.email is not None:
                    provider.email = input.email
                if input.address_line1 is not None:
                    provider.address_line1 = input.address_line1
                if input.address_line2 is not None:
                    provider.address_line2 = input.address_line2
                if input.city is not None:
                    provider.city = input.city
                if input.province is not None:
                    provider.province = input.province
                if input.postal_code is not None:
                    provider.postal_code = input.postal_code
                if input.office_hours is not None:
                    provider.office_hours = input.office_hours
                if input.appointment_booking_url is not None:
                    provider.appointment_booking_url = input.appointment_booking_url
                if input.patient_portal_url is not None:
                    provider.patient_portal_url = input.patient_portal_url
                if input.notes is not None:
                    provider.notes = input.notes
                if input.accepts_provincial_coverage is not None:
                    provider.accepts_provincial_coverage = input.accepts_provincial_coverage
                if input.languages_spoken is not None:
                    provider.languages_spoken = input.languages_spoken
                if input.referral_required is not None:
                    provider.referral_required = input.referral_required
                if input.patient_id is not None:
                    provider.patient_id = input.patient_id

                if input.last_visit_date is not None:
                    provider.last_visit_date = datetime.fromisoformat(input.last_visit_date).replace(tzinfo=timezone.utc)
                if input.next_appointment_date is not None:
                    provider.next_appointment_date = datetime.fromisoformat(input.next_appointment_date).replace(tzinfo=timezone.utc)

                provider.updated_at = datetime.now(timezone.utc)

                await session.commit()
                await session.refresh(provider)

                # Log successful update
                await log_emergency_access(
                    user_id=str(user.id),
                    action="update_healthcare_provider",
                    resource="healthcare_providers",
                    child_id=str(provider.child_id),
                    ip_address=audit_context.get("ip_address"),
                    user_agent=audit_context.get("user_agent"),
                    success=True
                )

                return HealthcareProviderResponse(
                    success=True,
                    message="Healthcare provider updated successfully",
                    healthcare_provider=healthcare_provider_to_graphql(provider)
                )

        except GraphQLError:
            raise
        except Exception as e:
            logger.error(f"Error updating healthcare provider: {e}")
            return HealthcareProviderResponse(
                success=False,
                message="Failed to update healthcare provider",
                errors=[str(e)]
            )

    @strawberry.mutation
    async def delete_healthcare_provider(
        self,
        info: Info,
        provider_id: str
    ) -> HealthcareProviderResponse:
        """Delete a healthcare provider"""
        try:
            user = await require_context_user(info)
            audit_context = await info.context.get_audit_context()

            async for session in get_async_session():
                # Get existing provider and verify access
                result = await session.execute(
                    select(HealthcareProviderModel)
                    .where(
                        and_(
                            HealthcareProviderModel.id == uuid.UUID(provider_id),
                            HealthcareProviderModel.family_id.in_(
                                select(FamilyMember.family_id)
                                .where(
                                    and_(
                                        FamilyMember.user_id == user.id,
                                        FamilyMember.is_active == True
                                    )
                                )
                            )
                        )
                    )
                )
                provider = result.scalar_one_or_none()

                if not provider:
                    return HealthcareProviderResponse(
                        success=False,
                        message="Healthcare provider not found or access denied",
                        errors=["Provider not found"]
                    )

                await session.delete(provider)
                await session.commit()

                # Log successful deletion
                await log_emergency_access(
                    user_id=str(user.id),
                    action="delete_healthcare_provider",
                    resource="healthcare_providers",
                    child_id=str(provider.child_id),
                    ip_address=audit_context.get("ip_address"),
                    user_agent=audit_context.get("user_agent"),
                    success=True
                )

                return HealthcareProviderResponse(
                    success=True,
                    message="Healthcare provider deleted successfully"
                )

        except GraphQLError:
            raise
        except Exception as e:
            logger.error(f"Error deleting healthcare provider: {e}")
            return HealthcareProviderResponse(
                success=False,
                message="Failed to delete healthcare provider",
                errors=[str(e)]
            )

    @strawberry.mutation
    async def generate_emergency_access_token(
        self,
        info: Info,
        input: CreateEmergencyAccessInput
    ) -> EmergencyAccessResponse:
        """Generate a new emergency access token"""
        try:
            user = await require_context_user(info)
            audit_context = await info.context.get_audit_context()

            async for session in get_async_session():
                # Get user's family ID
                family_result = await session.execute(
                    select(FamilyMember.family_id)
                    .where(
                        and_(
                            FamilyMember.user_id == user.id,
                            FamilyMember.is_active == True
                        )
                    )
                    .limit(1)  # Get the first family the user belongs to
                )
                family_id = family_result.scalar_one_or_none()

                if not family_id:
                    return EmergencyAccessResponse(
                        success=False,
                        message="User is not a member of any family",
                        errors=["No family membership found"]
                    )

                # If child_id is specified, verify access
                if input.child_id:
                    has_access = await verify_family_access(user, input.child_id, session)
                    if not has_access:
                        return EmergencyAccessResponse(
                            success=False,
                            message="Access denied to specified child",
                            errors=["Access denied"]
                        )

                # Create emergency access token
                access_token = EmergencyAccessModel.create_emergency_access(
                    family_id=str(family_id),
                    created_by=str(user.id),
                    duration_hours=input.duration_hours,
                    child_id=input.child_id,
                    recipient_name=input.recipient_name,
                    purpose=input.purpose
                )

                # Set permissions
                access_token.can_view_medical = input.can_view_medical
                access_token.can_view_contacts = input.can_view_contacts
                access_token.can_view_providers = input.can_view_providers
                access_token.can_view_location = input.can_view_location
                access_token.max_uses = input.max_uses
                access_token.recipient_phone = input.recipient_phone
                access_token.recipient_relationship = input.recipient_relationship
                access_token.notes = input.notes

                session.add(access_token)
                await session.commit()
                await session.refresh(access_token)

                # Generate QR code data
                base_url = "https://nestsync.app"  # Replace with actual app URL
                qr_data = QRCodeData(
                    url=access_token.get_access_url(base_url),
                    code=access_token.access_code,
                    expires=access_token.expires_at.isoformat(),
                    child_id=str(access_token.child_id) if access_token.child_id else None
                )

                # Log successful creation
                await log_emergency_access(
                    user_id=str(user.id),
                    action="generate_emergency_access_token",
                    resource="emergency_access",
                    child_id=input.child_id,
                    ip_address=audit_context.get("ip_address"),
                    user_agent=audit_context.get("user_agent"),
                    success=True
                )

                return EmergencyAccessResponse(
                    success=True,
                    message="Emergency access token created successfully",
                    emergency_access=emergency_access_to_graphql(access_token),
                    qr_code_data=qr_data
                )

        except GraphQLError:
            raise
        except Exception as e:
            logger.error(f"Error generating emergency access token: {e}")
            return EmergencyAccessResponse(
                success=False,
                message="Failed to generate emergency access token",
                errors=[str(e)]
            )

    @strawberry.mutation
    async def revoke_emergency_access_token(
        self,
        info: Info,
        access_id: str
    ) -> EmergencyAccessResponse:
        """Revoke an emergency access token"""
        try:
            user = await require_context_user(info)
            audit_context = await info.context.get_audit_context()

            async for session in get_async_session():
                # Get existing token and verify access
                result = await session.execute(
                    select(EmergencyAccessModel)
                    .where(
                        and_(
                            EmergencyAccessModel.id == uuid.UUID(access_id),
                            or_(
                                EmergencyAccessModel.created_by == user.id,
                                EmergencyAccessModel.family_id.in_(
                                    select(FamilyMember.family_id)
                                    .where(
                                        and_(
                                            FamilyMember.user_id == user.id,
                                            FamilyMember.is_active == True
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
                access_token = result.scalar_one_or_none()

                if not access_token:
                    return EmergencyAccessResponse(
                        success=False,
                        message="Emergency access token not found or access denied",
                        errors=["Token not found"]
                    )

                # Revoke the token
                access_token.revoke(str(user.id))
                await session.commit()
                await session.refresh(access_token)

                # Log successful revocation
                await log_emergency_access(
                    user_id=str(user.id),
                    action="revoke_emergency_access_token",
                    resource="emergency_access",
                    child_id=str(access_token.child_id) if access_token.child_id else None,
                    ip_address=audit_context.get("ip_address"),
                    user_agent=audit_context.get("user_agent"),
                    success=True
                )

                return EmergencyAccessResponse(
                    success=True,
                    message="Emergency access token revoked successfully",
                    emergency_access=emergency_access_to_graphql(access_token)
                )

        except GraphQLError:
            raise
        except Exception as e:
            logger.error(f"Error revoking emergency access token: {e}")
            return EmergencyAccessResponse(
                success=False,
                message="Failed to revoke emergency access token",
                errors=[str(e)]
            )

    @strawberry.mutation
    async def validate_health_card(
        self,
        info: Info,
        health_card_number: str,
        province: HealthCardProvinceEnum
    ) -> HealthCardValidationResult:
        """Validate Canadian health card number format"""
        try:
            await require_context_user(info)

            # Basic validation logic for Canadian health cards
            validation_errors = []
            suggestions = []
            is_valid = True

            # Remove spaces and special characters for validation
            cleaned_number = ''.join(filter(str.isalnum, health_card_number))

            # Province-specific validation
            if province == HealthCardProvinceEnum.ON:  # Ontario OHIP
                if len(cleaned_number) < 10:
                    is_valid = False
                    validation_errors.append("Ontario health card number should be 10 digits")
                    suggestions.append("Format: #### ### ###")

            elif province == HealthCardProvinceEnum.BC:  # British Columbia MSP
                if len(cleaned_number) < 9:
                    is_valid = False
                    validation_errors.append("BC health card number should be 9 digits")
                    suggestions.append("Format: #### #### #")

            elif province == HealthCardProvinceEnum.QC:  # Quebec RAMQ
                if len(cleaned_number) < 12:
                    is_valid = False
                    validation_errors.append("Quebec health card number should be 12 characters")
                    suggestions.append("Format: XXXX #### ####")
            else:
                # Generic validation for other provinces
                if len(cleaned_number) < 8:
                    is_valid = False
                    validation_errors.append("Health card number appears too short")
                    suggestions.append("Please verify the complete number")

            # Format the number based on province
            formatted_number = health_card_number
            if is_valid and cleaned_number:
                if province == HealthCardProvinceEnum.ON and len(cleaned_number) >= 10:
                    formatted_number = f"{cleaned_number[:4]}-{cleaned_number[4:7]}-{cleaned_number[7:10]}"
                elif province == HealthCardProvinceEnum.BC and len(cleaned_number) >= 9:
                    formatted_number = f"{cleaned_number[:4]} {cleaned_number[4:8]} {cleaned_number[8]}"
                elif province == HealthCardProvinceEnum.QC and len(cleaned_number) >= 12:
                    formatted_number = f"{cleaned_number[:4]} {cleaned_number[4:8]} {cleaned_number[8:12]}"

            return HealthCardValidationResult(
                is_valid=is_valid,
                formatted_number=formatted_number,
                province=province,
                validation_errors=validation_errors,
                suggestions=suggestions
            )

        except GraphQLError:
            raise
        except Exception as e:
            logger.error(f"Error validating health card: {e}")
            return HealthCardValidationResult(
                is_valid=False,
                formatted_number=health_card_number,
                province=province,
                validation_errors=["Validation service temporarily unavailable"],
                suggestions=[]
            )


# =============================================================================
# Export resolvers
# =============================================================================

__all__ = [
    "EmergencyQueries",
    "EmergencyMutations"
]