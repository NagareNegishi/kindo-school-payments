"""Student table."""

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Student(Base):
    __tablename__ = "student"
    __table_args__ = (UniqueConstraint("parent_id", "name"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    school_id: Mapped[int] = mapped_column(ForeignKey("school.id"))
    parent_id: Mapped[int] = mapped_column(ForeignKey("parent.id"))
