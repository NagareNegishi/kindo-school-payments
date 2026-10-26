"""Registration endpoints."""

import datetime as dt

from fastapi import APIRouter
from sqlalchemy.exc import IntegrityError

from app.db import Session, get_or_404
from app.errors import api_error
from app.models import Activity, Registration, Student
from app.schemas.payment import PaymentCreate
from app.schemas.receipt import ReceiptOut
from app.schemas.registration import RegistrationCreate, RegistrationOut
from app.services.payment import pay_registration
from app.services.receipt import load_receipt

router = APIRouter(prefix="/registrations", tags=["registrations"])


@router.post("", response_model=RegistrationOut, status_code=201)
async def create_registration(body: RegistrationCreate, session: Session):
    """Register a child for an upcoming activity."""
    await get_or_404(
        session, Student, body.student_id, "student_not_found", "Child not found.", "student_id"
    )
    activity = await get_or_404(
        session,
        Activity,
        body.activity_id,
        "activity_not_found",
        "Activity not found.",
        "activity_id",
    )
    if activity.date < dt.date.today():
        raise api_error(409, "activity_past", "This trip has already happened.", "activity_id")
    registration = Registration(student_id=body.student_id, activity_id=body.activity_id)
    session.add(registration)
    try:
        await session.commit()
    except IntegrityError:
        # The unique constraint decides, so two simultaneous requests cannot both pass.
        await session.rollback()
        raise api_error(
            409,
            "already_registered",
            "This child is already registered for this trip.",
            "student_id",
        ) from None
    await session.refresh(registration)  # loads the server-set created_at
    return registration


@router.post("/{registration_id}/payments", response_model=ReceiptOut, status_code=201)
async def create_payment(registration_id: int, body: PaymentCreate, session: Session):
    """Pay for a registration. Allowed after the trip date; a decline returns 402."""
    attempt = await pay_registration(session, registration_id, body)
    if attempt.status != "success":
        raise api_error(402, "payment_declined", attempt.error_message, None)
    return await load_receipt(session, attempt.id)
