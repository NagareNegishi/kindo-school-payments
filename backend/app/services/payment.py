"""Payment service: pay one registration through the legacy processor.

`pay_registration` runs the plan's payment flow in order; each step is a helper below.
"""

import datetime as dt
import logging

from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.errors import api_error
from app.legacy.adapter import ChargeRequest, charge
from app.legacy.processor import PaymentResponse
from app.models import Activity, Parent, PaymentAttempt, Registration, Student
from app.schemas.payment import PaymentCreate

logger = logging.getLogger(__name__)

STALE_AFTER = dt.timedelta(seconds=60)
FALLBACK_ERROR = "Payment could not be processed. Please try again."


def _in_progress_error():
    return api_error(
        409, "payment_in_progress", "A payment is already in progress.", "registration_id"
    )


async def _load_registration(
    session: AsyncSession, registration_id: int
) -> tuple[Registration, Student, Parent, Activity]:
    """Load the registration with its child, parent and trip, or raise a 404."""
    row = (
        await session.execute(
            select(Registration, Student, Parent, Activity)
            .join(Student, Registration.student_id == Student.id)
            .join(Parent, Student.parent_id == Parent.id)
            .join(Activity, Registration.activity_id == Activity.id)
            .where(Registration.id == registration_id)
        )
    ).first()
    if row is None:
        raise api_error(404, "registration_not_found", "Registration not found.", "registration_id")
    return tuple(row)


async def _fail_stale_attempts(session: AsyncSession, registration_id: int) -> None:
    """Mark `pending` attempts older than 60 s `failed`.

    A pending attempt that old means the server crashed mid-payment. Without this the
    registration would stay blocked forever.
    """
    await session.execute(
        update(PaymentAttempt)
        .where(
            PaymentAttempt.registration_id == registration_id,
            PaymentAttempt.status == "pending",
            PaymentAttempt.created_at < func.now() - STALE_AFTER,
        )
        .values(status="failed", error_message="Payment timed out.")
    )


async def _reject_if_unpayable(session: AsyncSession, registration: Registration) -> None:
    """Raise a 409 if the registration is already paid or has a payment running."""
    if registration.status == "paid":
        raise api_error(409, "already_paid", "This trip is already paid.", "registration_id")
    pending = await session.scalar(
        select(PaymentAttempt.id).where(
            PaymentAttempt.registration_id == registration.id,
            PaymentAttempt.status == "pending",
        )
    )
    if pending is not None:
        raise _in_progress_error()


async def _start_attempt(
    session: AsyncSession, registration: Registration, activity: Activity, card: PaymentCreate
) -> PaymentAttempt:
    """Insert a `pending` attempt and commit, so a crash mid-payment leaves a trace.

    The amount is copied from the activity; only the last 4 card digits are kept.
    """
    attempt = PaymentAttempt(
        registration_id=registration.id,
        amount_cents=activity.cost_cents,
        status="pending",
        card_last4=card.card_last4,
    )
    session.add(attempt)
    try:
        await session.commit()
    except IntegrityError:
        # The check in `_reject_if_unpayable` can race: a concurrent request inserted its live
        # attempt first, and the partial unique index refused ours.
        await session.rollback()
        raise _in_progress_error() from None
    return attempt


def _build_charge(
    student: Student, parent: Parent, activity: Activity, card: PaymentCreate
) -> ChargeRequest:
    """Gather the values the adapter turns into the legacy processor's payload."""
    return ChargeRequest(
        student_name=student.name,
        parent_name=parent.name,
        cost_cents=activity.cost_cents,
        card_number=card.card_number,
        expiry_date=card.expiry_date,
        cvv=card.cvv,
        school_id=activity.school_id,
        activity_id=activity.id,
    )


async def _charge_or_fail(request: ChargeRequest, attempt_id: int) -> PaymentResponse:
    """Call the processor; a crash inside it becomes a failed response, not an exception."""
    try:
        return await charge(request)
    except Exception:
        logger.exception("legacy processor failed for attempt %s", attempt_id)
        return PaymentResponse(success=False, error_message=FALLBACK_ERROR)


async def _record_result(
    session: AsyncSession,
    attempt: PaymentAttempt,
    registration: Registration,
    response: PaymentResponse,
) -> None:
    """Store the processor's answer on the attempt and, on success, mark the registration paid."""
    if response.success:
        attempt.status = "success"
        attempt.legacy_transaction_id = response.transaction_id
        # Same commit as the attempt, so the two can never disagree.
        registration.status = "paid"
    else:
        attempt.status = "failed"
        attempt.error_message = response.error_message or FALLBACK_ERROR
        logger.warning("payment declined for attempt %s: %s", attempt.id, attempt.error_message)
    await session.commit()
    await session.refresh(attempt)  # loads the server-set timestamps


async def pay_registration(
    session: AsyncSession, registration_id: int, card: PaymentCreate
) -> PaymentAttempt:
    """Run the payment flow and return the finished attempt, `success` or `failed`.

    Raises a 404 for an unknown registration and a 409 when it is already paid or a payment
    is in progress. The amount always comes from the activity, never from the caller.
    """
    registration, student, parent, activity = await _load_registration(session, registration_id)

    # Recover from a crash, then refuse a registration that is paid or being paid.
    await _fail_stale_attempts(session, registration_id)
    await _reject_if_unpayable(session, registration)

    # Record the attempt before calling the processor, then call it and store the answer.
    attempt = await _start_attempt(session, registration, activity, card)
    response = await _charge_or_fail(_build_charge(student, parent, activity, card), attempt.id)
    await _record_result(session, attempt, registration, response)

    logger.info(
        "payment attempt %s for registration %s: %s", attempt.id, registration_id, attempt.status
    )
    return attempt
