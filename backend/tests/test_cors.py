from app.config import settings

PREFLIGHT = {"Access-Control-Request-Method": "GET"}


async def test_configured_origin_passes_preflight(client):
    res = await client.options(
        "/parents", headers={"Origin": settings.frontend_origin, **PREFLIGHT}
    )

    assert res.status_code == 200
    assert res.headers["access-control-allow-origin"] == settings.frontend_origin


async def test_configured_origin_gets_the_header_on_a_normal_response(client):
    res = await client.get("/parents", headers={"Origin": settings.frontend_origin})

    assert res.headers["access-control-allow-origin"] == settings.frontend_origin


async def test_other_origin_is_not_allowed(client):
    other = "http://other.example"

    preflight = await client.options("/parents", headers={"Origin": other, **PREFLIGHT})
    normal = await client.get("/parents", headers={"Origin": other})

    assert "access-control-allow-origin" not in preflight.headers
    assert "access-control-allow-origin" not in normal.headers
