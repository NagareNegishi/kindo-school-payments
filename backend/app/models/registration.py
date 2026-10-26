"""Registration table: a student signed up for an activity."""

import datetime as dt

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Registration(Base):
    __tablename__ = "registration"
    __table_args__ = (UniqueConstraint("student_id", "activity_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("student.id"))
    activity_id: Mapped[int] = mapped_column(ForeignKey("activity.id"))
    status: Mapped[str] = mapped_column(String(20), default="registered")
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
