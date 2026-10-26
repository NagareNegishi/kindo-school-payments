"""Payment attempt table: one row per try to pay a registration."""

import datetime as dt

from sqlalchemy import DateTime, ForeignKey, Index, String, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class PaymentAttempt(Base):
    __tablename__ = "payment_attempt"
    # One live (pending or success) attempt per registration; failed ones may repeat.
    __table_args__ = (
        Index(
            "uq_payment_attempt_live",
            "registration_id",
            unique=True,
            postgresql_where=text("status IN ('pending', 'success')"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    registration_id: Mapped[int] = mapped_column(ForeignKey("registration.id"))
    amount_cents: Mapped[int]
    status: Mapped[str] = mapped_column(String(20))
    legacy_transaction_id: Mapped[str | None] = mapped_column(String(100))
    error_message: Mapped[str | None]
    card_last4: Mapped[str] = mapped_column(String(4))
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
