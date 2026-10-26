"""Parent read endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.errors import api_error
from app.models import Activity, Parent, Registration, School, Student
from app.schemas.read import ActivityOut, ParentOut, StudentOut
from app.schemas.registration import RegistrationDetail
from app.schemas.student import StudentCreate

router = APIRouter(prefix="/parents", tags=["parents"])

Session = Annotated[AsyncSession, Depends(get_session)]


async def _get_parent(session: AsyncSession, parent_id: int) -> Parent:
    parent = await session.get(Parent, parent_id)
    if parent is None:
        raise api_error(404, "parent_not_found", "Parent not found.", "parent_id")
    return parent


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
    rows = await session.execute(
        select(Registration, Student, Activity)
        .join(Student, Registration.student_id == Student.id)
        .join(Activity, Registration.activity_id == Activity.id)
        .where(Student.parent_id == parent_id)
        .order_by(Activity.date, Registration.id)
    )
    return [
        RegistrationDetail(
            id=reg.id,
            student_id=reg.student_id,
            activity_id=reg.activity_id,
            status=reg.status,
            created_at=reg.created_at,
            student=StudentOut.model_validate(student),
            activity=ActivityOut.model_validate(activity),
        )
        for reg, student, activity in rows
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
