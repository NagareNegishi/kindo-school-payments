"""Demo reset endpoint: puts the database back to the seed. Off unless enabled in settings."""

import logging

from fastapi import APIRouter, Response

from app.config import settings
from app.db import Session
from app.errors import api_error
from app.seed import reset_to_seed

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/demo", tags=["demo"])


@router.post("/reset", status_code=204)
async def reset_demo(session: Session) -> Response:
    """Delete all registrations, payments and added children, then re-seed."""
    # Disabled by default so a deployed instance cannot be wiped by anyone.
    if not settings.demo_reset_enabled:
        raise api_error(404, "not_found", "Not found.", None)
    await reset_to_seed(session)
    await session.commit()
    logger.info("demo data reset to seed")
    return Response(status_code=204)
