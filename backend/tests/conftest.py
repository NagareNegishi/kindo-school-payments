from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from app.config import settings
from app.db import get_session
from app.main import app
from app.models import Base
from app.seed import seed


@pytest.fixture
async def session() -> AsyncIterator[AsyncSession]:
    """Seeded session inside an outer transaction that is rolled back at the end.

    Endpoint commits only release a savepoint, so the dev database stays untouched.
    Every table is emptied inside that transaction first, so rows already in the
    database never change a test's outcome.
    """
    engine = create_async_engine(settings.database_url, poolclass=NullPool)
    try:
        async with engine.connect() as conn:
            outer = await conn.begin()
            for table in reversed(Base.metadata.sorted_tables):
                await conn.execute(table.delete())
            async with AsyncSession(
                conn, join_transaction_mode="create_savepoint", expire_on_commit=False
            ) as s:
                await seed(s)
                yield s
            await outer.rollback()
    finally:
        await engine.dispose()


@pytest.fixture
async def client(session: AsyncSession) -> AsyncIterator[AsyncClient]:
    """API client that serves every request from the test session."""

    async def override() -> AsyncIterator[AsyncSession]:
        yield session

    app.dependency_overrides[get_session] = override
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            yield c
    finally:
        app.dependency_overrides.clear()
