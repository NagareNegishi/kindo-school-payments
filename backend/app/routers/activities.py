"""Activity read endpoints."""

import datetime as dt
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.errors import api_error
from app.models import Activity
from app.schemas.read import ActivityOut

router = APIRouter(prefix="/activities", tags=["activities"])

Session = Annotated[AsyncSession, Depends(get_session)]


@router.get("", response_model=list[ActivityOut])
async def list_activities(session: Session):
    """Upcoming activities only: date today or later, soonest first."""
    result = await session.scalars(
        select(Activity)
        .where(Activity.date >= dt.date.today())
        .order_by(Activity.date, Activity.id)
    )
    return result.all()


@router.get("/{activity_id}", response_model=ActivityOut)
async def get_activity(activity_id: int, session: Session):
    activity = await session.get(Activity, activity_id)
    if activity is None:
        raise api_error(404, "activity_not_found", "Activity not found.", "activity_id")
    return activity
