"""
GraphQL Types for Emergency Flows
PIPEDA-compliant emergency information access for NestSync
"""

import strawberry
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timezone
from enum import Enum

# =============================================================================
# Emergency Enums
# =============================================================================

@strawberry.enum
class BloodTypeEnum(Enum):
    """Blood type classifications"""
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"
    UNKNOWN = "Unknown"


@strawberry.enum
class HealthCardProvinceEnum(Enum):
    """Canadian provincial/territorial health card systems"""
    ON = "ON"  # Ontario Health Insurance Plan (OHIP)
    BC = "BC"  # Medical Services Plan (MSP)
    AB = "AB"  # Alberta Health Care Insurance Plan (AHCIP)
    SK = "SK"  # Saskatchewan Health Services Card
    MB = "MB"  # Manitoba Health Services Insurance Plan
    QC = "QC"  # Régie de l'assurance maladie du Québec (RAMQ)
    NB = "NB"  # Medicare (New Brunswick)
    NS = "NS"  # Medical Services Insurance (MSI)
    PE = "PE"  # PEI Health Card
    NL = "NL"  # Medical Care Plan (MCP)
    YT = "YT"  # Yukon Health Care Insurance Plan
    NT = "NT"  # Northwest Territories Health Care Plan
    NU = "NU"  # Nunavut Health Care Plan


@strawberry.enum
class ProviderTypeEnum(Enum):
    """Types of healthcare providers"""
    PEDIATRICIAN = "pediatrician"
    FAMILY_DOCTOR = "family_doctor"
    DENTIST = "dentist"
    OPTOMETRIST = "optometrist"
    SPECIALIST = "specialist"
    WALK_IN_CLINIC = "walk_in_clinic"
    EMERGENCY_ROOM = "emergency_room"
    THERAPIST = "therapist"
    PHARMACY = "pharmacy"
    OTHER = "other"


# =============================================================================
# Emergency Contact Types
# =============================================================================

@strawberry.type
class EmergencyContact:
    """Emergency contact information for quick access during child emergencies"""
    id: str
    child_id: str
    family_id: str
    name: str
    relationship: str
    phone_primary: str
    phone_secondary: Optional[str] = None
    email: Optional[str] = None
    is_primary: bool
    priority_order: int
    address: Optional[str] = None
    notes: Optional[str] = None
    can_pickup: bool
    can_make_medical_decisions: bool
    province: Optional[str] = None
    speaks_french: bool
    speaks_english: bool
    last_verified_at: Optional[datetime] = None
    consent_given_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


@strawberry.input
class CreateEmergencyContactInput:
    """Input for creating a new emergency contact"""
    child_id: str
    name: str
    relationship: str
    phone_primary: str
    phone_secondary: Optional[str] = None
    email: Optional[str] = None
    is_primary: bool = False
    priority_order: int = 999
    address: Optional[str] = None
    notes: Optional[str] = None
    can_pickup: bool = False
    can_make_medical_decisions: bool = False
    province: Optional[str] = None
    speaks_french: bool = False
    speaks_english: bool = True


@strawberry.input
class UpdateEmergencyContactInput:
    """Input for updating an emergency contact"""
    id: str
    name: Optional[str] = None
    relationship: Optional[str] = None
    phone_primary: Optional[str] = None
    phone_secondary: Optional[str] = None
    email: Optional[str] = None
    is_primary: Optional[bool] = None
    priority_order: Optional[int] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    can_pickup: Optional[bool] = None
    can_make_medical_decisions: Optional[bool] = None
    province: Optional[str] = None
    speaks_french: Optional[bool] = None
    speaks_english: Optional[bool] = None


# =============================================================================
# Medical Information Types
# =============================================================================

@strawberry.type
class AllergyInfo:
    """Allergy information with severity and treatment details"""
    allergen: str
    severity: str  # mild, moderate, severe, life-threatening
    reaction: Optional[str] = None
    treatment: Optional[str] = None
    verified_date: Optional[str] = None


@strawberry.type
class MedicationInfo:
    """Current medication with dosage and schedule"""
    name: str
    dosage: str
    frequency: str
    prescribing_doctor: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    notes: Optional[str] = None


@strawberry.type
class MedicalConditionInfo:
    """Medical condition with treatment and monitoring details"""
    condition: str
    diagnosed_date: Optional[str] = None
    severity: str
    treatment_plan: Optional[str] = None
    monitoring_required: bool


@strawberry.type
class ImmunizationInfo:
    """Immunization record with dates and administration details"""
    vaccine: str
    date_given: str
    dose_number: int
    next_dose_due: Optional[str] = None
    administered_by: Optional[str] = None


@strawberry.type
class SurgeryProcedureInfo:
    """Past surgery or major procedure information"""
    procedure: str
    date: str
    hospital: Optional[str] = None
    surgeon: Optional[str] = None
    notes: Optional[str] = None


@strawberry.type
class HospitalizationInfo:
    """Past hospitalization information"""
    reason: str
    admission_date: str
    discharge_date: Optional[str] = None
    hospital: Optional[str] = None
    attending_physician: Optional[str] = None
    notes: Optional[str] = None


@strawberry.type
class MedicalInformation:
    """Comprehensive medical information for emergency situations"""
    id: str
    child_id: str
    family_id: str
    blood_type: Optional[BloodTypeEnum] = None
    allergies: List[AllergyInfo]
    has_epipen: bool
    medications: List[MedicationInfo]
    medical_conditions: List[MedicalConditionInfo]
    health_card_number: Optional[str] = None
    health_card_province: Optional[HealthCardProvinceEnum] = None
    health_card_expiry: Optional[date] = None
    health_card_version: Optional[str] = None
    immunizations: List[ImmunizationInfo]
    emergency_notes: Optional[str] = None
    special_instructions: Optional[str] = None
    medical_devices: List[str]
    private_insurance_provider: Optional[str] = None
    private_insurance_number: Optional[str] = None
    surgeries_procedures: List[SurgeryProcedureInfo]
    hospitalizations: List[HospitalizationInfo]
    last_updated_by: Optional[str] = None
    last_verified_at: Optional[date] = None
    consent_to_share_with_providers: bool
    created_at: datetime
    updated_at: datetime


@strawberry.input
class AllergyInput:
    """Input for adding/updating allergy information"""
    allergen: str
    severity: str
    reaction: Optional[str] = None
    treatment: Optional[str] = None


@strawberry.input
class MedicationInput:
    """Input for adding/updating medication information"""
    name: str
    dosage: str
    frequency: str
    prescribing_doctor: Optional[str] = None
    notes: Optional[str] = None


@strawberry.input
class MedicalConditionInput:
    """Input for adding/updating medical condition information"""
    condition: str
    severity: str = "moderate"
    treatment_plan: Optional[str] = None


@strawberry.input
class ImmunizationInput:
    """Input for adding immunization records"""
    vaccine: str
    date_given: str
    dose_number: int
    next_dose_due: Optional[str] = None
    administered_by: Optional[str] = None


@strawberry.input
class UpdateMedicalInformationInput:
    """Input for updating medical information"""
    child_id: str
    blood_type: Optional[BloodTypeEnum] = None
    health_card_number: Optional[str] = None
    health_card_province: Optional[HealthCardProvinceEnum] = None
    health_card_expiry: Optional[str] = None
    health_card_version: Optional[str] = None
    emergency_notes: Optional[str] = None
    special_instructions: Optional[str] = None
    private_insurance_provider: Optional[str] = None
    private_insurance_number: Optional[str] = None
    consent_to_share_with_providers: Optional[bool] = None
    allergies: Optional[List[AllergyInput]] = None
    medications: Optional[List[MedicationInput]] = None
    medical_conditions: Optional[List[MedicalConditionInput]] = None
    medical_devices: Optional[List[str]] = None
    immunizations: Optional[List[ImmunizationInput]] = None


# =============================================================================
# Healthcare Provider Types
# =============================================================================

@strawberry.type
class HealthcareProvider:
    """Healthcare provider information for medical care coordination"""
    id: str
    child_id: str
    family_id: str
    provider_type: ProviderTypeEnum
    is_primary: bool
    provider_name: str
    clinic_name: Optional[str] = None
    specialty: Optional[str] = None
    phone: str
    phone_emergency: Optional[str] = None
    fax: Optional[str] = None
    email: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    province: str
    postal_code: str
    office_hours: Optional[str] = None
    appointment_booking_url: Optional[str] = None
    patient_portal_url: Optional[str] = None
    notes: Optional[str] = None
    accepts_provincial_coverage: bool
    languages_spoken: Optional[str] = None
    referral_required: bool
    last_visit_date: Optional[datetime] = None
    next_appointment_date: Optional[datetime] = None
    patient_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


@strawberry.input
class CreateHealthcareProviderInput:
    """Input for creating a new healthcare provider"""
    child_id: str
    provider_type: ProviderTypeEnum
    is_primary: bool = False
    provider_name: str
    clinic_name: Optional[str] = None
    specialty: Optional[str] = None
    phone: str
    phone_emergency: Optional[str] = None
    fax: Optional[str] = None
    email: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    province: str
    postal_code: str
    office_hours: Optional[str] = None
    appointment_booking_url: Optional[str] = None
    patient_portal_url: Optional[str] = None
    notes: Optional[str] = None
    accepts_provincial_coverage: bool = True
    languages_spoken: Optional[str] = None
    referral_required: bool = False
    patient_id: Optional[str] = None


@strawberry.input
class UpdateHealthcareProviderInput:
    """Input for updating a healthcare provider"""
    id: str
    provider_type: Optional[ProviderTypeEnum] = None
    is_primary: Optional[bool] = None
    provider_name: Optional[str] = None
    clinic_name: Optional[str] = None
    specialty: Optional[str] = None
    phone: Optional[str] = None
    phone_emergency: Optional[str] = None
    fax: Optional[str] = None
    email: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None
    office_hours: Optional[str] = None
    appointment_booking_url: Optional[str] = None
    patient_portal_url: Optional[str] = None
    notes: Optional[str] = None
    accepts_provincial_coverage: Optional[bool] = None
    languages_spoken: Optional[str] = None
    referral_required: Optional[bool] = None
    last_visit_date: Optional[str] = None
    next_appointment_date: Optional[str] = None
    patient_id: Optional[str] = None


# =============================================================================
# Emergency Access Types
# =============================================================================

@strawberry.type
class AccessLogEntry:
    """Emergency access log entry"""
    accessed_at: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    action: str
    success: bool


@strawberry.type
class EmergencyAccess:
    """Temporary emergency access tokens for sharing child medical information"""
    id: str
    family_id: str
    child_id: Optional[str] = None
    created_by: str
    access_token: str
    access_code: str
    expires_at: datetime
    is_active: bool
    max_uses: Optional[int] = None
    use_count: int
    can_view_medical: bool
    can_view_contacts: bool
    can_view_providers: bool
    can_view_location: bool
    recipient_name: Optional[str] = None
    recipient_phone: Optional[str] = None
    recipient_relationship: Optional[str] = None
    purpose: Optional[str] = None
    notes: Optional[str] = None
    access_log: List[AccessLogEntry]
    last_accessed_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    revoked_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


@strawberry.input
class CreateEmergencyAccessInput:
    """Input for creating emergency access token"""
    child_id: Optional[str] = None  # If null, access to all family children
    duration_hours: int = 24
    recipient_name: Optional[str] = None
    recipient_phone: Optional[str] = None
    recipient_relationship: Optional[str] = None
    purpose: Optional[str] = None
    notes: Optional[str] = None
    max_uses: Optional[int] = None
    can_view_medical: bool = True
    can_view_contacts: bool = True
    can_view_providers: bool = True
    can_view_location: bool = False


@strawberry.type
class QRCodeData:
    """QR code data for emergency access sharing"""
    url: str
    code: str
    expires: str
    child_id: Optional[str] = None


# =============================================================================
# Emergency Information Response Types
# =============================================================================

@strawberry.type
class EmergencyInformation:
    """Complete emergency information for a child"""
    child_id: str
    child_name: str
    child_birth_date: date
    emergency_contacts: List[EmergencyContact]
    medical_information: Optional[MedicalInformation] = None
    healthcare_providers: List[HealthcareProvider]
    last_updated: datetime


@strawberry.type
class EmergencyContactConnection:
    """Paginated emergency contacts"""
    edges: List[EmergencyContact]
    total_count: int


@strawberry.type
class HealthcareProviderConnection:
    """Paginated healthcare providers"""
    edges: List[HealthcareProvider]
    total_count: int


@strawberry.type
class EmergencyAccessConnection:
    """Paginated emergency access tokens"""
    edges: List[EmergencyAccess]
    total_count: int


# =============================================================================
# Response Types
# =============================================================================

@strawberry.type
class EmergencyContactResponse:
    """Response for emergency contact mutations"""
    success: bool
    message: str
    emergency_contact: Optional[EmergencyContact] = None
    errors: Optional[List[str]] = None


@strawberry.type
class MedicalInformationResponse:
    """Response for medical information mutations"""
    success: bool
    message: str
    medical_information: Optional[MedicalInformation] = None
    errors: Optional[List[str]] = None


@strawberry.type
class HealthcareProviderResponse:
    """Response for healthcare provider mutations"""
    success: bool
    message: str
    healthcare_provider: Optional[HealthcareProvider] = None
    errors: Optional[List[str]] = None


@strawberry.type
class EmergencyAccessResponse:
    """Response for emergency access token mutations"""
    success: bool
    message: str
    emergency_access: Optional[EmergencyAccess] = None
    qr_code_data: Optional[QRCodeData] = None
    errors: Optional[List[str]] = None


@strawberry.type
class EmergencyInformationResponse:
    """Response for emergency information queries"""
    success: bool
    message: str
    emergency_information: Optional[EmergencyInformation] = None
    errors: Optional[List[str]] = None


# =============================================================================
# Health Card Validation Types
# =============================================================================

@strawberry.type
class HealthCardValidationResult:
    """Result of health card validation"""
    is_valid: bool
    formatted_number: str
    province: HealthCardProvinceEnum
    validation_errors: List[str]
    suggestions: List[str]


# =============================================================================
# Export all types
# =============================================================================

__all__ = [
    "BloodTypeEnum",
    "HealthCardProvinceEnum",
    "ProviderTypeEnum",
    "EmergencyContact",
    "CreateEmergencyContactInput",
    "UpdateEmergencyContactInput",
    "AllergyInfo",
    "MedicationInfo",
    "MedicalConditionInfo",
    "ImmunizationInfo",
    "SurgeryProcedureInfo",
    "HospitalizationInfo",
    "MedicalInformation",
    "AllergyInput",
    "MedicationInput",
    "MedicalConditionInput",
    "ImmunizationInput",
    "UpdateMedicalInformationInput",
    "HealthcareProvider",
    "CreateHealthcareProviderInput",
    "UpdateHealthcareProviderInput",
    "AccessLogEntry",
    "EmergencyAccess",
    "CreateEmergencyAccessInput",
    "QRCodeData",
    "EmergencyInformation",
    "EmergencyContactConnection",
    "HealthcareProviderConnection",
    "EmergencyAccessConnection",
    "EmergencyContactResponse",
    "MedicalInformationResponse",
    "HealthcareProviderResponse",
    "EmergencyAccessResponse",
    "EmergencyInformationResponse",
    "HealthCardValidationResult"
]