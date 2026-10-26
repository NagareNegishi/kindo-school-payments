"""Adapter between our payment service and the blocking legacy processor."""

from dataclasses import dataclass

from starlette.concurrency import run_in_threadpool

from app.legacy.processor import LegacyPaymentProcessor, PaymentResponse

_processor = LegacyPaymentProcessor()


@dataclass(frozen=True)
class ChargeRequest:
    """Values for one charge, in our own types; the adapter converts them."""

    student_name: str
    parent_name: str
    cost_cents: int
    card_number: str
    expiry_date: str
    cvv: str
    school_id: int
    activity_id: int


def build_payload(req: ChargeRequest) -> dict:
    """Map a charge request to the field types the legacy processor expects."""
    return {
        "student_name": req.student_name,
        "parent_name": req.parent_name,
        # The processor rejects Decimal, so send a float.
        "amount": req.cost_cents / 100,
        "card_number": req.card_number.replace(" ", ""),
        "expiry_date": req.expiry_date,
        "cvv": req.cvv,
        "school_id": str(req.school_id),
        "activity_id": str(req.activity_id),
    }


async def charge(req: ChargeRequest) -> PaymentResponse:
    """Send a charge to the processor off the event loop (it blocks for 1.5 s)."""
    return await run_in_threadpool(_processor.process_payment, build_payload(req))
