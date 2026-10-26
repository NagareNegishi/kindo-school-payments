"""Parent read endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import Parent
from app.schemas.read import ParentOut

router = APIRouter(prefix="/parents", tags=["parents"])

Session = Annotated[AsyncSession, Depends(get_session)]


@router.get("", response_model=list[ParentOut])
async def list_parents(session: Session):
    """Seeded parents for the header dropdown."""
    result = await session.scalars(select(Parent).order_by(Parent.id))
    return result.all()
