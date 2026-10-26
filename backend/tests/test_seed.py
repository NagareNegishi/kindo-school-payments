import datetime as dt

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from app.config import settings
from app.models import Activity, Parent, School, Student
from app.seed import seed

TABLES = (School, Activity, Parent, Student)


async def _counts(session: AsyncSession) -> list[int]:
    return [await session.scalar(select(func.count()).select_from(t)) for t in TABLES]


async def test_seed_gives_the_parents_two_one_and_no_children(session):
    rows = await session.execute(
        select(Parent.name, func.count(Student.id))
        .outerjoin(Student, Student.parent_id == Parent.id)
        .group_by(Parent.name)
    )

    assert dict(rows.all()) == {"Aroha Smith": 2, "Tom Wilson": 1, "Priya Patel": 0}


async def test_seed_leaves_existing_rows_as_they_are(session):
    trip = await session.scalar(select(Activity).where(Activity.title == "Zoo Trip"))
    trip.date = dt.date(2030, 1, 1)
    trip.cost_cents = 9999
    await session.flush()

    await seed(session)
    await session.refresh(trip)

    assert (trip.date, trip.cost_cents) == (dt.date(2030, 1, 1), 9999)


async def test_seed_twice_adds_no_duplicates():
    engine = create_async_engine(settings.database_url, poolclass=NullPool)
    try:
        async with AsyncSession(engine) as session:
            await seed(session)
            first = await _counts(session)
            await seed(session)
            second = await _counts(session)
            await session.rollback()  # leave the dev database untouched
    finally:
        await engine.dispose()

    assert first == second
    assert second == [1, 1, 3, 3]
