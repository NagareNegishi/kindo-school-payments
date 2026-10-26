import datetime as dt

from sqlalchemy import select

from app.models import Activity, Parent, Registration, School, Student


async def _student_id(session, name: str) -> int:
    return await session.scalar(select(Student.id).where(Student.name == name))


async def _parent_id(session, name: str) -> int:
    return await session.scalar(select(Parent.id).where(Parent.name == name))


async def _trip_id(session) -> int:
    return await session.scalar(select(Activity.id).where(Activity.title == "Zoo Trip"))


async def _past_trip(session) -> Activity:
    school = await session.scalar(select(School))
    activity = Activity(
        school_id=school.id,
        title="Old Trip",
        date=dt.date.today() - dt.timedelta(days=2),
        cost_cents=1000,
    )
    session.add(activity)
    await session.flush()
    return activity


async def test_register_child(client, session):
    body = {
        "student_id": await _student_id(session, "Mia Smith"),
        "activity_id": await _trip_id(session),
    }

    res = await client.post("/registrations", json=body)

    assert res.status_code == 201
    assert res.json()["status"] == "registered"
    assert (res.json()["student_id"], res.json()["activity_id"]) == (
        body["student_id"],
        body["activity_id"],
    )
    assert res.json()["created_at"]


async def test_duplicate_registration_409(client, session):
    body = {
        "student_id": await _student_id(session, "Mia Smith"),
        "activity_id": await _trip_id(session),
    }
    await client.post("/registrations", json=body)

    res = await client.post("/registrations", json=body)

    assert res.status_code == 409
    assert res.json()["code"] == "already_registered"


async def test_registration_for_past_activity_409(client, session):
    past = await _past_trip(session)
    body = {"student_id": await _student_id(session, "Mia Smith"), "activity_id": past.id}

    res = await client.post("/registrations", json=body)

    assert res.status_code == 409
    assert res.json()["code"] == "activity_past"


async def test_registration_unknown_ids_404(client, session):
    student = await _student_id(session, "Mia Smith")
    trip = await _trip_id(session)

    bad_student = await client.post(
        "/registrations", json={"student_id": 999999, "activity_id": trip}
    )
    bad_trip = await client.post(
        "/registrations", json={"student_id": student, "activity_id": 999999}
    )

    assert (bad_student.status_code, bad_student.json()["field"]) == (404, "student_id")
    assert (bad_trip.status_code, bad_trip.json()["field"]) == (404, "activity_id")


async def test_registration_bad_body_422(client):
    res = await client.post("/registrations", json={"student_id": "abc", "activity_id": 1})

    assert res.status_code == 422
    assert res.json()["field"] == "student_id"


async def test_parent_registrations_include_past_and_only_own(client, session):
    mia = await _student_id(session, "Mia Smith")
    ella = await _student_id(session, "Ella Wilson")
    trip = await _trip_id(session)
    past = await _past_trip(session)
    session.add_all(
        [
            Registration(student_id=mia, activity_id=trip),
            Registration(student_id=mia, activity_id=past.id),
            Registration(student_id=ella, activity_id=trip),
        ]
    )
    await session.flush()

    res = await client.get(f"/parents/{await _parent_id(session, 'Aroha Smith')}/registrations")

    assert res.status_code == 200
    rows = res.json()
    assert [r["activity"]["title"] for r in rows] == ["Old Trip", "Zoo Trip"]
    assert {r["student"]["name"] for r in rows} == {"Mia Smith"}
    assert rows[0]["status"] == "registered"
    assert rows[1]["activity"]["cost_cents"] == 4500


async def test_parent_registrations_unknown_parent_404(client):
    res = await client.get("/parents/999999/registrations")

    assert res.status_code == 404
    assert res.json()["code"] == "parent_not_found"
