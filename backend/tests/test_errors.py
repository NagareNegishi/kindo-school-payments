import logging

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from app.errors import api_error, register_exception_handlers
from app.schemas.payment import PaymentCreate


@pytest.fixture
def client() -> TestClient:
    app = FastAPI()
    register_exception_handlers(app)

    @app.post("/pay")
    async def pay(body: PaymentCreate):
        return {"last4": body.card_last4}

    @app.get("/conflict")
    async def conflict():
        raise api_error(409, "already_paid", "This trip is already paid.", "registration_id")

    @app.get("/teapot")
    async def teapot():
        raise HTTPException(418, "short and stout")

    @app.get("/boom")
    async def boom():
        raise RuntimeError("exploded")

    return TestClient(app, raise_server_exceptions=False)


def test_validation_error_shape(client):
    res = client.post("/pay", json={"card_number": "123", "expiry_date": "12/30", "cvv": "123"})
    assert res.status_code == 422
    assert res.json() == {
        "code": "invalid_card_number",
        "message": "Card number must be 16 digits.",
        "field": "card_number",
    }


def test_missing_body_has_no_field(client):
    res = client.post("/pay")
    assert res.status_code == 422
    assert set(res.json()) == {"code", "message", "field"}
    assert res.json()["field"] is None


def test_api_error_shape(client):
    res = client.get("/conflict")
    assert res.status_code == 409
    assert res.json() == {
        "code": "already_paid",
        "message": "This trip is already paid.",
        "field": "registration_id",
    }


def test_plain_http_exception_shape(client):
    res = client.get("/teapot")
    assert res.status_code == 418
    assert res.json() == {"code": "i'm_a_teapot", "message": "short and stout", "field": None}


def test_unknown_route_shape(client):
    res = client.get("/nope")
    assert res.status_code == 404
    assert res.json() == {"code": "not_found", "message": "Not Found", "field": None}


def test_unhandled_error_is_generic(client):
    res = client.get("/boom")
    assert res.status_code == 500
    assert res.json() == {
        "code": "internal_error",
        "message": "Something went wrong. Please try again.",
        "field": None,
    }


def test_errors_are_logged_without_card_data(client, caplog):
    caplog.set_level(logging.INFO)
    bad = {"card_number": "4111 1111 1111 111x", "expiry_date": "01/20", "cvv": "98x"}
    client.post("/pay", json=bad)
    client.get("/conflict")
    client.get("/boom")
    assert "validation error" in caplog.text
    assert "http 409" in caplog.text
    assert "unhandled error" in caplog.text
    for secret in bad.values():
        assert secret not in caplog.text
