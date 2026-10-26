"""Receipt lookup: a payment attempt with its child and trip."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Activity, PaymentAttempt, Registration, Student
from app.schemas.receipt import AttemptOut, ReceiptOut


async def load_receipt(session: AsyncSession, attempt_id: int) -> ReceiptOut | None:
    """Return the receipt data for one attempt, or None if it does not exist."""
    row = (
        await session.execute(
            select(PaymentAttempt, Student, Activity)
            .join(Registration, PaymentAttempt.registration_id == Registration.id)
            .join(Student, Registration.student_id == Student.id)
            .join(Activity, Registration.activity_id == Activity.id)
            .where(PaymentAttempt.id == attempt_id)
        )
    ).first()
    if row is None:
        return None
    attempt, student, activity = row
    return ReceiptOut(
        **AttemptOut.model_validate(attempt).model_dump(),
        student_name=student.name,
        activity_title=activity.title,
        activity_date=activity.date,
    )
