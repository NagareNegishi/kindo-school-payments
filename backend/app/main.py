"""FastAPI app: runs migrations and the seed on start, allows the frontend origin."""

import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import SessionLocal, engine
from app.errors import register_exception_handlers
from app.routers import activities, parents, registrations
from app.seed import seed

ALEMBIC_INI = Path(__file__).resolve().parent.parent / "alembic.ini"


def run_migrations() -> None:
    """Upgrade the database to the latest revision."""
    command.upgrade(Config(str(ALEMBIC_INI)), "head")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Alembic's env.py calls asyncio.run, so it needs a thread without a running loop.
    await asyncio.to_thread(run_migrations)
    async with SessionLocal() as session:
        await seed(session)
        await session.commit()
    yield
    await engine.dispose()


app = FastAPI(lifespan=lifespan)
register_exception_handlers(app)
app.include_router(activities.router)
app.include_router(parents.router)
app.include_router(registrations.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_methods=["*"],
    allow_headers=["*"],
)
