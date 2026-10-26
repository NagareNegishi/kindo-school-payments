"""Activity read endpoints."""

import datetime as dt

from fastapi import APIRouter
from sqlalchemy import select

from app.db import Session, get_or_404
from app.models import Activity
from app.schemas.read import ActivityOut

router = APIRouter(prefix="/activities", tags=["activities"])


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
    return await get_or_404(
        session, Activity, activity_id, "activity_not_found", "Activity not found.", "activity_id"
    )
