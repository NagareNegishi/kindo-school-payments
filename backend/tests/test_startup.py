from sqlalchemy import func, select

from app.db import SessionLocal
from app.main import app
from app.models import Parent, School


async def test_startup_migrates_and_seeds():
    async with app.router.lifespan_context(app), SessionLocal() as session:
        parents = await session.scalar(select(func.count()).select_from(Parent))
        schools = await session.scalar(select(func.count()).select_from(School))

    assert (schools, parents) == (1, 3)
