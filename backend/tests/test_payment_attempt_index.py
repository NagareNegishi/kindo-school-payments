"""The partial unique index allows one live (pending or success) attempt per registration."""

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.models import Activity, AttemptStatus, PaymentAttempt, Registration, Student


async def _registration_id(session) -> int:
    student = await session.scalar(select(Student).where(Student.name == "Mia Smith"))
    activity = await session.scalar(select(Activity).where(Activity.title == "Zoo Trip"))
    registration = Registration(student_id=student.id, activity_id=activity.id)
    session.add(registration)
    await session.flush()
    return registration.id


def _attempt(registration_id: int, status: AttemptStatus) -> PaymentAttempt:
    return PaymentAttempt(
        registration_id=registration_id, amount_cents=4500, status=status, card_last4="1111"
    )


async def test_failed_attempts_can_repeat(session):
    registration_id = await _registration_id(session)

    session.add_all([_attempt(registration_id, AttemptStatus.FAILED) for _ in range(3)])
    await session.flush()


async def test_failed_attempts_can_sit_next_to_a_success(session):
    registration_id = await _registration_id(session)

    session.add_all(
        [
            _attempt(registration_id, AttemptStatus.SUCCESS),
            _attempt(registration_id, AttemptStatus.FAILED),
            _attempt(registration_id, AttemptStatus.FAILED),
        ]
    )
    await session.flush()


async def test_pending_is_allowed_after_failed_attempts(session):
    registration_id = await _registration_id(session)

    session.add_all(
        [
            _attempt(registration_id, AttemptStatus.FAILED),
            _attempt(registration_id, AttemptStatus.PENDING),
        ]
    )
    await session.flush()


@pytest.mark.parametrize(
    ("first", "second"),
    [
        (AttemptStatus.PENDING, AttemptStatus.PENDING),
        (AttemptStatus.SUCCESS, AttemptStatus.SUCCESS),
        (AttemptStatus.SUCCESS, AttemptStatus.PENDING),
        (AttemptStatus.PENDING, AttemptStatus.SUCCESS),
    ],
)
async def test_a_second_live_attempt_is_rejected(session, first, second):
    registration_id = await _registration_id(session)
    session.add(_attempt(registration_id, first))
    await session.flush()

    session.add(_attempt(registration_id, second))

    with pytest.raises(IntegrityError):
        await session.flush()
