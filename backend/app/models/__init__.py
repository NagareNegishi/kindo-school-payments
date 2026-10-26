"""ORM models; importing this package registers every table on Base.metadata."""

from app.models.activity import Activity
from app.models.base import Base
from app.models.parent import Parent
from app.models.payment_attempt import AttemptStatus, PaymentAttempt
from app.models.registration import Registration, RegistrationStatus
from app.models.school import School
from app.models.student import Student

__all__ = [
    "Activity",
    "AttemptStatus",
    "Base",
    "Parent",
    "PaymentAttempt",
    "Registration",
    "RegistrationStatus",
    "School",
    "Student",
]
