import datetime as dt

from sqlalchemy import select

from app.models import Activity, School


async def _add_activity(session, title: str, date: dt.date) -> Activity:
    school = await session.scalar(select(School))
    activity = Activity(school_id=school.id, title=title, date=date, cost_cents=1000)
    session.add(activity)
    await session.flush()
    return activity


async def test_list_activities_hides_past(client, session):
    today = dt.date.today()
    await _add_activity(session, "Old Trip", today - dt.timedelta(days=1))
    await _add_activity(session, "Today Trip", today)

    res = await client.get("/activities")

    assert res.status_code == 200
    titles = [a["title"] for a in res.json()]
    assert "Old Trip" not in titles
    assert titles[0] == "Today Trip"
    assert "Zoo Trip" in titles


async def test_get_activity(client, session):
    activity = await _add_activity(session, "Museum", dt.date.today() + dt.timedelta(days=3))

    res = await client.get(f"/activities/{activity.id}")

    assert res.status_code == 200
    body = res.json()
    assert (body["title"], body["cost_cents"], body["location"]) == ("Museum", 1000, None)


async def test_get_past_activity_is_still_found(client, session):
    activity = await _add_activity(session, "Old Trip", dt.date.today() - dt.timedelta(days=5))

    res = await client.get(f"/activities/{activity.id}")

    assert res.status_code == 200


async def test_get_missing_activity_404(client):
    res = await client.get("/activities/999999")

    assert res.status_code == 404
    assert res.json() == {
        "code": "activity_not_found",
        "message": "Activity not found.",
        "field": "activity_id",
    }


async def test_list_parents(client):
    res = await client.get("/parents")

    assert res.status_code == 200
    assert [p["name"] for p in res.json()] == ["Aroha Smith", "Tom Wilson", "Priya Patel"]
    assert set(res.json()[0]) == {"id", "name", "email"}
