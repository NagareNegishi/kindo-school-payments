"""Async SQLAlchemy engine and session factory."""

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.errors import api_error

engine = create_async_engine(settings.database_url)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency yielding one session per request."""
    async with SessionLocal() as session:
        yield session


Session = Annotated[AsyncSession, Depends(get_session)]


async def get_or_404[T](
    session: AsyncSession, model: type[T], row_id: int, code: str, message: str, field: str
) -> T:
    """Return the row with this primary key, or raise the 404 error `code`."""
    row = await session.get(model, row_id)
    if row is None:
        raise api_error(404, code, message, field)
    return row
