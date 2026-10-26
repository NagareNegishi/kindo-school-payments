"""Activity table; `type` holds the subtype, trip-only fields are nullable."""

import datetime as dt

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Activity(Base):
    __tablename__ = "activity"
    __table_args__ = (UniqueConstraint("school_id", "title", "date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    school_id: Mapped[int] = mapped_column(ForeignKey("school.id"))
    type: Mapped[str] = mapped_column(String(20), default="trip")
    title: Mapped[str] = mapped_column(String(200))
    date: Mapped[dt.date]
    location: Mapped[str | None] = mapped_column(String(200))
    cost_cents: Mapped[int]
    description: Mapped[str | None]
