"""Registration endpoints."""

import datetime as dt
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.errors import api_error
from app.models import Activity, Registration, Student
from app.schemas.payment import PaymentCreate
from app.schemas.receipt import ReceiptOut
from app.schemas.registration import RegistrationCreate, RegistrationOut
from app.services.payment import pay_registration
from app.services.receipt import load_receipt

router = APIRouter(prefix="/registrations", tags=["registrations"])

Session = Annotated[AsyncSession, Depends(get_session)]


@router.post("", response_model=RegistrationOut, status_code=201)
async def create_registration(body: RegistrationCreate, session: Session):
    """Register a child for an upcoming activity."""
    if await session.get(Student, body.student_id) is None:
        raise api_error(404, "student_not_found", "Child not found.", "student_id")
    activity = await session.get(Activity, body.activity_id)
    if activity is None:
        raise api_error(404, "activity_not_found", "Activity not found.", "activity_id")
    if activity.date < dt.date.today():
        raise api_error(409, "activity_past", "This trip has already happened.", "activity_id")
    existing = await session.scalar(
        select(Registration.id).where(
            Registration.student_id == body.student_id,
            Registration.activity_id == body.activity_id,
        )
    )
    if existing is not None:
        raise api_error(
            409,
            "already_registered",
            "This child is already registered for this trip.",
            "student_id",
        )
    registration = Registration(student_id=body.student_id, activity_id=body.activity_id)
    session.add(registration)
    await session.commit()
    await session.refresh(registration)  # loads the server-set created_at
    return registration


@router.post("/{registration_id}/payments", response_model=ReceiptOut, status_code=201)
async def create_payment(registration_id: int, body: PaymentCreate, session: Session):
    """Pay for a registration. Allowed after the trip date; a decline returns 402."""
    attempt = await pay_registration(session, registration_id, body)
    if attempt.status != "success":
        raise api_error(402, "payment_declined", attempt.error_message, None)
    return await load_receipt(session, attempt.id)
