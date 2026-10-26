"""Request schema for paying a registration, with the card field rules."""

import datetime as dt
import re

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic_core import PydanticCustomError

_CARD_RE = re.compile(r"[0-9]{16}")  # 16 digits, spaces already removed
_EXPIRY_RE = re.compile(r"(0[1-9]|1[0-2])/([0-9]{2})")  # MM/YY, month 01-12
_CVV_RE = re.compile(r"[0-9]{3}")  # exactly 3 digits


def normalize_card_number(value: str) -> str:
    """Strip spaces and require exactly 16 ASCII digits."""
    digits = value.replace(" ", "")
    if not _CARD_RE.fullmatch(digits):
        raise PydanticCustomError("invalid_card_number", "Card number must be 16 digits.")
    return digits


def check_expiry(value: str, today: dt.date) -> str:
    """Require `MM/YY` with a real month, not before the current month."""
    match = _EXPIRY_RE.fullmatch(value)
    if not match:
        raise PydanticCustomError("invalid_expiry_format", "Expiry must be MM/YY.")
    month, year = int(match[1]), 2000 + int(match[2])
    if (year, month) < (today.year, today.month):
        raise PydanticCustomError("card_expired", "Card has expired.")
    return value


def check_cvv(value: str) -> str:
    """Require exactly 3 ASCII digits."""
    if not _CVV_RE.fullmatch(value):
        raise PydanticCustomError("invalid_cvv", "CVV must be 3 digits.")
    return value


class PaymentCreate(BaseModel):
    """Card details only. Extra fields are rejected, so a client cannot send an amount."""

    model_config = ConfigDict(extra="forbid")

    card_number: str
    expiry_date: str
    cvv: str

    @field_validator("card_number")
    @classmethod
    def _card_number(cls, value: str) -> str:
        return normalize_card_number(value)

    @field_validator("expiry_date")
    @classmethod
    def _expiry_date(cls, value: str) -> str:
        return check_expiry(value, dt.date.today())

    @field_validator("cvv")
    @classmethod
    def _cvv(cls, value: str) -> str:
        return check_cvv(value)

    @property
    def card_last4(self) -> str:
        return self.card_number[-4:]
