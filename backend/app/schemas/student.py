"""Request schema for adding a child."""

from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

# Trimmed, 1-100 characters.
ChildName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


class StudentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: ChildName
