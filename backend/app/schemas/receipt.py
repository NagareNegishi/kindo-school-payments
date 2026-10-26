"""Response schema for a payment attempt, with the data a receipt shows."""

import datetime as dt

from pydantic import BaseModel


class ReceiptOut(BaseModel):
    id: int
    registration_id: int
    status: str
    amount_cents: int
    legacy_transaction_id: str | None
    card_last4: str
    created_at: dt.datetime
    student_name: str
    activity_title: str
    activity_date: dt.date
