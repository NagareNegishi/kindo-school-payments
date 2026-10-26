from sqlalchemy import select

from app.models import Parent


async def _parent_id(session, name: str) -> int:
    return await session.scalar(select(Parent.id).where(Parent.name == name))


async def test_students_only_for_selected_parent(client, session):
    aroha = await _parent_id(session, "Aroha Smith")
    tom = await _parent_id(session, "Tom Wilson")

    res_aroha = await client.get(f"/parents/{aroha}/students")
    res_tom = await client.get(f"/parents/{tom}/students")

    assert [s["name"] for s in res_aroha.json()] == ["Mia Smith", "Liam Smith"]
    assert [s["name"] for s in res_tom.json()] == ["Ella Wilson"]
    assert {s["parent_id"] for s in res_aroha.json()} == {aroha}


async def test_parent_with_no_children_gets_empty_list(client, session):
    priya = await _parent_id(session, "Priya Patel")

    res = await client.get(f"/parents/{priya}/students")

    assert res.status_code == 200
    assert res.json() == []


async def test_students_unknown_parent_404(client):
    res = await client.get("/parents/999999/students")

    assert res.status_code == 404
    assert res.json()["code"] == "parent_not_found"


async def test_add_child_under_parent(client, session):
    priya = await _parent_id(session, "Priya Patel")

    res = await client.post(f"/parents/{priya}/students", json={"name": "  Noa Patel "})

    assert res.status_code == 201
    assert res.json()["name"] == "Noa Patel"
    assert res.json()["parent_id"] == priya
    listed = await client.get(f"/parents/{priya}/students")
    assert [s["name"] for s in listed.json()] == ["Noa Patel"]


async def test_add_child_bad_name_422(client, session):
    priya = await _parent_id(session, "Priya Patel")

    res = await client.post(f"/parents/{priya}/students", json={"name": "   "})

    assert res.status_code == 422
    assert res.json()["field"] == "name"


async def test_add_child_unknown_parent_404(client):
    res = await client.post("/parents/999999/students", json={"name": "Noa"})

    assert res.status_code == 404
    assert res.json()["code"] == "parent_not_found"


async def test_add_duplicate_child_409(client, session):
    aroha = await _parent_id(session, "Aroha Smith")

    res = await client.post(f"/parents/{aroha}/students", json={"name": "Mia Smith"})

    assert res.status_code == 409
    assert res.json() == {
        "code": "student_exists",
        "message": "You already have a child with this name.",
        "field": "name",
    }
