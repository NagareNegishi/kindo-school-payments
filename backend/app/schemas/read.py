"""Response schemas for the read endpoints."""

import datetime as dt

from pydantic import BaseModel, ConfigDict


class ActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    school_id: int
    type: str
    title: str
    date: dt.date
    location: str | None
    cost_cents: int
    description: str | None


class ParentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
