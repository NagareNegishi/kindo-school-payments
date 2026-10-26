"""The migration upgrades an empty database to head and downgrades it back to base."""

import asyncio
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

from app.config import settings

ALEMBIC_INI = Path(__file__).resolve().parents[1] / "alembic.ini"
SCRATCH_DB = "kindo_migration_test"
TABLES = {"school", "parent", "student", "activity", "registration", "payment_attempt"}


def _url(database: str) -> str:
    return make_url(settings.database_url).set(database=database).render_as_string(False)


async def _recreate_scratch_db() -> None:
    engine = create_async_engine(_url("postgres"), isolation_level="AUTOCOMMIT", poolclass=NullPool)
    try:
        async with engine.connect() as conn:
            await conn.execute(text(f'DROP DATABASE IF EXISTS "{SCRATCH_DB}" WITH (FORCE)'))
            await conn.execute(text(f'CREATE DATABASE "{SCRATCH_DB}"'))
    finally:
        await engine.dispose()


async def _tables(url: str) -> set[str]:
    engine = create_async_engine(url, poolclass=NullPool)
    try:
        async with engine.connect() as conn:
            rows = await conn.execute(
                text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
            )
            return {row[0] for row in rows}
    finally:
        await engine.dispose()


def test_upgrade_head_then_downgrade_base(monkeypatch):
    asyncio.run(_recreate_scratch_db())
    url = _url(SCRATCH_DB)
    # env.py reads the URL from settings, so point it at the scratch database.
    monkeypatch.setattr(settings, "database_url", url)
    config = Config(str(ALEMBIC_INI))

    command.upgrade(config, "head")
    assert TABLES <= asyncio.run(_tables(url))

    command.downgrade(config, "base")
    assert not TABLES & asyncio.run(_tables(url))
