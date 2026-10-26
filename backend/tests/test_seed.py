from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from app.config import settings
from app.models import Activity, Parent, School, Student
from app.seed import seed

TABLES = (School, Activity, Parent, Student)


async def _counts(session: AsyncSession) -> list[int]:
    return [await session.scalar(select(func.count()).select_from(t)) for t in TABLES]


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
