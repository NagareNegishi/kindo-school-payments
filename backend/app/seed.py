"""Idempotent demo seed: one school, one trip, three parents with 2, 1 and 0 children."""

import datetime as dt

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Activity, Base, Parent, School, Student

SCHOOL_NAME = "Kindo Primary School"
TRIP_TITLE = "Zoo Trip"
TRIP_LEAD_DAYS = 30

# parent name, email, children
PARENTS = [
    ("Aroha Smith", "aroha.smith@example.com", ["Mia Smith", "Liam Smith"]),
    ("Tom Wilson", "tom.wilson@example.com", ["Ella Wilson"]),
    ("Priya Patel", "priya.patel@example.com", []),
]


async def _get_or_create[T: Base](
    session: AsyncSession, model: type[T], lookup: dict, defaults: dict | None = None
) -> T:
    """Return the row matching `lookup`, inserting it with `defaults` if missing."""
    row = await session.scalar(select(model).filter_by(**lookup))
    if row is None:
        row = model(**lookup, **(defaults or {}))
        session.add(row)
        await session.flush()
    return row


async def seed(session: AsyncSession) -> None:
    """Insert any missing demo rows. Does not commit; the caller owns the transaction."""
    school = await _get_or_create(session, School, {"name": SCHOOL_NAME})

    # Looked up by title only: the date is set once, so restarts on later days add no duplicate.
    await _get_or_create(
        session,
        Activity,
        {"school_id": school.id, "title": TRIP_TITLE},
        {
            "type": "trip",
            "date": dt.date.today() + dt.timedelta(days=TRIP_LEAD_DAYS),
            "location": "Auckland Zoo",
            "cost_cents": 4500,
            "description": "A day at the zoo for the whole class. Bring a packed lunch.",
        },
    )

    for name, email, children in PARENTS:
        parent = await _get_or_create(session, Parent, {"email": email}, {"name": name})
        for child in children:
            await _get_or_create(
                session,
                Student,
                {"parent_id": parent.id, "name": child},
                {"school_id": school.id},
            )
