"""Receipt endpoint."""

from fastapi import APIRouter

from app.db import Session
from app.errors import api_error
from app.schemas.receipt import ReceiptOut
from app.services.receipt import load_receipt

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("/{payment_id}", response_model=ReceiptOut)
async def get_payment(payment_id: int, session: Session):
    """Receipt data for one payment attempt."""
    receipt = await load_receipt(session, payment_id)
    if receipt is None:
        raise api_error(404, "payment_not_found", "Payment not found.", "payment_id")
    return receipt
