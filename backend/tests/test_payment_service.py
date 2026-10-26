import datetime as dt
import logging
from contextlib import contextmanager
from unittest.mock import patch

import pytest
from fastapi import HTTPException
from sqlalchemy import select

from app.models import Activity, PaymentAttempt, Registration, School, Student
from app.schemas.payment import PaymentCreate
from app.services.payment import pay_registration

CARD = PaymentCreate(card_number="4111 1111 1111 1111", expiry_date="12/40", cvv="123")


@contextmanager
def processor(random_value: float = 0.5):
    """Patch the legacy processor's `time.sleep` and `random`; below 0.1 it declines."""
    with (
        patch("app.legacy.processor.time.sleep"),
        patch("app.legacy.processor.random.random", return_value=random_value),
        patch("app.legacy.processor.random.randint", return_value=1234),
    ):
        yield


async def _registration(session, activity: Activity | None = None) -> Registration:
    student = await session.scalar(select(Student).where(Student.name == "Mia Smith"))
    if activity is None:
        activity = await session.scalar(select(Activity).where(Activity.title == "Zoo Trip"))
    registration = Registration(student_id=student.id, activity_id=activity.id)
    session.add(registration)
    await session.flush()
    return registration


async def _attempts(session, registration_id: int) -> list[PaymentAttempt]:
    result = await session.scalars(
        select(PaymentAttempt)
        .where(PaymentAttempt.registration_id == registration_id)
        .order_by(PaymentAttempt.id)
    )
    return list(result)


async def _error(coro) -> HTTPException:
    with pytest.raises(HTTPException) as exc:
        await coro
    return exc.value


async def test_success_marks_attempt_and_registration(session):
    registration = await _registration(session)

    with processor():
        attempt = await pay_registration(session, registration.id, CARD)

    assert attempt.status == "success"
    assert attempt.legacy_transaction_id.endswith("-1234")
    assert attempt.amount_cents == 4500
    assert attempt.card_last4 == "1111"
    assert attempt.created_at and attempt.updated_at
    assert registration.status == "paid"


async def test_decline_keeps_registration_open_and_retry_succeeds(session):
    registration = await _registration(session)

    with processor(random_value=0.01):
        declined = await pay_registration(session, registration.id, CARD)
    assert declined.status == "failed"
    assert "declined" in declined.error_message
    assert registration.status == "registered"

    with processor():
        retry = await pay_registration(session, registration.id, CARD)

    assert retry.status == "success"
    assert registration.status == "paid"
    assert [a.status for a in await _attempts(session, registration.id)] == ["failed", "success"]


async def test_stale_pending_attempt_is_failed_and_retry_allowed(session):
    registration = await _registration(session)
    stale = PaymentAttempt(
        registration_id=registration.id,
        amount_cents=4500,
        status="pending",
        card_last4="1111",
        created_at=dt.datetime.now(dt.UTC) - dt.timedelta(minutes=2),
    )
    session.add(stale)
    await session.flush()

    with processor():
        attempt = await pay_registration(session, registration.id, CARD)

    await session.refresh(stale)
    assert stale.status == "failed"
    assert attempt.status == "success"


async def test_fresh_pending_attempt_blocks_payment(session):
    registration = await _registration(session)
    session.add(
        PaymentAttempt(
            registration_id=registration.id, amount_cents=4500, status="pending", card_last4="1111"
        )
    )
    await session.flush()

    error = await _error(pay_registration(session, registration.id, CARD))

    assert error.status_code == 409
    assert error.detail["code"] == "payment_in_progress"


async def test_second_payment_on_paid_registration_409(session):
    registration = await _registration(session)
    with processor():
        await pay_registration(session, registration.id, CARD)

        error = await _error(pay_registration(session, registration.id, CARD))

    assert error.status_code == 409
    assert error.detail["code"] == "already_paid"
    assert len(await _attempts(session, registration.id)) == 1


async def test_unknown_registration_404(session):
    error = await _error(pay_registration(session, 999999, CARD))

    assert error.status_code == 404
    assert error.detail["code"] == "registration_not_found"


async def test_payment_for_past_activity_accepted(session):
    school = await session.scalar(select(School))
    past = Activity(
        school_id=school.id,
        title="Old Trip",
        date=dt.date.today() - dt.timedelta(days=3),
        cost_cents=2000,
    )
    session.add(past)
    await session.flush()
    registration = await _registration(session, past)

    with processor():
        attempt = await pay_registration(session, registration.id, CARD)

    assert attempt.status == "success"
    assert attempt.amount_cents == 2000


async def test_processor_crash_records_failed_attempt(session):
    registration = await _registration(session)

    with patch("app.services.payment.charge", side_effect=RuntimeError("boom")):
        attempt = await pay_registration(session, registration.id, CARD)

    assert attempt.status == "failed"
    assert "could not be processed" in attempt.error_message
    assert registration.status == "registered"


async def test_payment_logs_contain_no_card_data(session, caplog):
    caplog.set_level(logging.INFO)
    registration = await _registration(session)

    with processor(random_value=0.01):
        await pay_registration(session, registration.id, CARD)

    assert "payment attempt" in caplog.text
    assert "declined" in caplog.text
    for secret in ("4111", "12/40", "123"):
        assert secret not in caplog.text.replace(f"registration {registration.id}", "")
