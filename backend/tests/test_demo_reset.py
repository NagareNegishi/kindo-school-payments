from sqlalchemy import func, select

from app.config import settings
from app.models import Activity, Parent, PaymentAttempt, Registration, Student


async def _add_demo_activity(session) -> None:
    """Add a child, a registration and a payment on top of the seed."""
    parent = await session.scalar(select(Parent).where(Parent.name == "Priya Patel"))
    trip = await session.scalar(select(Activity))
    school_id = trip.school_id
    child = Student(parent_id=parent.id, school_id=school_id, name="Demo Child")
    session.add(child)
    await session.flush()
    registration = Registration(student_id=child.id, activity_id=trip.id, status="paid")
    session.add(registration)
    await session.flush()
    session.add(
        PaymentAttempt(
            registration_id=registration.id, amount_cents=4500, status="success", card_last4="1111"
        )
    )
    await session.flush()


async def _count(session, model) -> int:
    return await session.scalar(select(func.count()).select_from(model))


async def test_reset_is_off_by_default(client, session):
    await _add_demo_activity(session)

    res = await client.post("/demo/reset")

    assert res.status_code == 404
    assert res.json()["code"] == "not_found"
    assert await _count(session, Registration) == 1


async def test_reset_returns_the_database_to_the_seed(client, session, monkeypatch):
    monkeypatch.setattr(settings, "demo_reset_enabled", True)
    await _add_demo_activity(session)

    res = await client.post("/demo/reset")

    assert res.status_code == 204
    assert await _count(session, Registration) == 0
    assert await _count(session, PaymentAttempt) == 0
    assert await _count(session, Student) == 3
    assert await _count(session, Parent) == 3
    assert await _count(session, Activity) == 1
