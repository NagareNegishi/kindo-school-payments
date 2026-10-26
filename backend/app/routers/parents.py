"""Parent read endpoints."""

from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import Session, get_or_404
from app.errors import api_error
from app.models import (
    Activity,
    AttemptStatus,
    Parent,
    PaymentAttempt,
    Registration,
    School,
    Student,
)
from app.schemas.read import ActivityOut, ParentOut, StudentOut
from app.schemas.registration import RegistrationDetail, RegistrationOut
from app.schemas.student import StudentCreate

router = APIRouter(prefix="/parents", tags=["parents"])


async def _get_parent(session: AsyncSession, parent_id: int) -> Parent:
    return await get_or_404(
        session, Parent, parent_id, "parent_not_found", "Parent not found.", "parent_id"
    )


@router.get("", response_model=list[ParentOut])
async def list_parents(session: Session):
    """Seeded parents for the header dropdown."""
    result = await session.scalars(select(Parent).order_by(Parent.id))
    return result.all()


@router.get("/{parent_id}/students", response_model=list[StudentOut])
async def list_students(parent_id: int, session: Session):
    """Children of one parent only."""
    await _get_parent(session, parent_id)
    result = await session.scalars(
        select(Student).where(Student.parent_id == parent_id).order_by(Student.id)
    )
    return result.all()


@router.get("/{parent_id}/registrations", response_model=list[RegistrationDetail])
async def list_registrations(parent_id: int, session: Session):
    """Registrations of the parent's children, past trips included."""
    await _get_parent(session, parent_id)
    # At most one successful attempt per registration (partial unique index).
    rows = await session.execute(
        select(Registration, Student, Activity, PaymentAttempt.id)
        .join(Student, Registration.student_id == Student.id)
        .join(Activity, Registration.activity_id == Activity.id)
        .outerjoin(
            PaymentAttempt,
            (PaymentAttempt.registration_id == Registration.id)
            & (PaymentAttempt.status == AttemptStatus.SUCCESS),
        )
        .where(Student.parent_id == parent_id)
        .order_by(Activity.date, Registration.id)
    )
    return [
        RegistrationDetail(
            **RegistrationOut.model_validate(reg).model_dump(),
            student=StudentOut.model_validate(student),
            activity=ActivityOut.model_validate(activity),
            payment_id=payment_id,
        )
        for reg, student, activity, payment_id in rows
    ]


@router.post("/{parent_id}/students", response_model=StudentOut, status_code=201)
async def create_student(parent_id: int, body: StudentCreate, session: Session):
    """Add a child under the parent, at the first school (one school in the first round)."""
    await _get_parent(session, parent_id)
    taken = await session.scalar(
        select(Student.id).where(Student.parent_id == parent_id, Student.name == body.name)
    )
    if taken is not None:
        raise api_error(409, "student_exists", "You already have a child with this name.", "name")
    school_id = await session.scalar(select(School.id).order_by(School.id).limit(1))
    student = Student(name=body.name, school_id=school_id, parent_id=parent_id)
    session.add(student)
    await session.commit()
    return student
