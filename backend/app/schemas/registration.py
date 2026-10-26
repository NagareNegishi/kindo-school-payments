"""Request and response schemas for registrations."""

import datetime as dt

from pydantic import BaseModel, ConfigDict

from app.schemas.read import ActivityOut, StudentOut


class RegistrationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    student_id: int
    activity_id: int


class RegistrationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    activity_id: int
    status: str
    created_at: dt.datetime


class RegistrationDetail(RegistrationOut):
    """A registration with its child and trip, for the parent's list."""

    student: StudentOut
    activity: ActivityOut
