import datetime as dt
import logging
from contextlib import contextmanager
from unittest.mock import patch

from sqlalchemy import select

from app.models import Activity, Registration, School, Student

CARD = {"card_number": "4111 1111 1111 1111", "expiry_date": "12/40", "cvv": "123"}


@contextmanager
def processor(random_value: float = 0.5):
    """Patch the legacy processor's `time.sleep` and `random`; below 0.1 it declines."""
    with (
        patch("app.legacy.processor.time.sleep"),
        patch("app.legacy.processor.random.random", return_value=random_value),
        patch("app.legacy.processor.random.randint", return_value=1234),
    ):
        yield


async def _registration(session, activity: Activity | None = None) -> Registration:
    student = await session.scalar(select(Student).where(Student.name == "Mia Smith"))
    if activity is None:
        activity = await session.scalar(select(Activity).where(Activity.title == "Zoo Trip"))
    registration = Registration(student_id=student.id, activity_id=activity.id)
    session.add(registration)
    await session.flush()
    return registration


async def test_payment_success_returns_receipt(client, session):
    registration = await _registration(session)

    with processor():
        res = await client.post(f"/registrations/{registration.id}/payments", json=CARD)

    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "success"
    assert body["legacy_transaction_id"].endswith("-1234")
    assert body["amount_cents"] == 4500
    assert body["card_last4"] == "1111"
    assert (body["student_name"], body["activity_title"]) == ("Mia Smith", "Zoo Trip")
    assert registration.status == "paid"


async def test_payment_response_has_no_card_data(client, session):
    registration = await _registration(session)

    with processor():
        res = await client.post(f"/registrations/{registration.id}/payments", json=CARD)

    assert not {"card_number", "expiry_date", "cvv"} & res.json().keys()
    assert "4111111111111111" not in res.text
    assert "12/40" not in res.text


async def test_decline_returns_402_then_retry_succeeds(client, session):
    registration = await _registration(session)
    url = f"/registrations/{registration.id}/payments"

    with processor(random_value=0.01):
        declined = await client.post(url, json=CARD)
    assert declined.status_code == 402
    assert declined.json() == {
        "code": "payment_declined",
        "message": "Payment declined by processor. Please try again.",
        "field": None,
    }
    assert registration.status == "registered"

    with processor():
        retry = await client.post(url, json=CARD)
    assert retry.status_code == 201
    assert registration.status == "paid"


async def test_second_payment_409(client, session):
    registration = await _registration(session)
    url = f"/registrations/{registration.id}/payments"
    with processor():
        await client.post(url, json=CARD)

        res = await client.post(url, json=CARD)

    assert res.status_code == 409
    assert res.json()["code"] == "already_paid"


async def test_payment_unknown_registration_404(client):
    res = await client.post("/registrations/999999/payments", json=CARD)

    assert res.status_code == 404
    assert res.json()["code"] == "registration_not_found"


async def test_payment_bad_card_422_names_field(client, session):
    registration = await _registration(session)

    res = await client.post(
        f"/registrations/{registration.id}/payments", json={**CARD, "cvv": "12"}
    )

    assert res.status_code == 422
    assert res.json()["field"] == "cvv"


async def test_client_amount_rejected(client, session):
    registration = await _registration(session)

    res = await client.post(
        f"/registrations/{registration.id}/payments", json={**CARD, "amount": 1}
    )

    assert res.status_code == 422
    assert res.json()["field"] == "amount"


async def test_payment_for_past_activity_accepted(client, session):
    school = await session.scalar(select(School))
    past = Activity(
        school_id=school.id,
        title="Old Trip",
        date=dt.date.today() - dt.timedelta(days=3),
        cost_cents=2000,
    )
    session.add(past)
    await session.flush()
    registration = await _registration(session, past)

    with processor():
        res = await client.post(f"/registrations/{registration.id}/payments", json=CARD)

    assert res.status_code == 201
    assert res.json()["amount_cents"] == 2000


async def test_get_payment_receipt(client, session):
    registration = await _registration(session)
    with processor():
        paid = await client.post(f"/registrations/{registration.id}/payments", json=CARD)

    res = await client.get(f"/payments/{paid.json()['id']}")

    assert res.status_code == 200
    assert res.json() == paid.json()


async def test_get_missing_payment_404(client):
    res = await client.get("/payments/999999")

    assert res.status_code == 404
    assert res.json() == {
        "code": "payment_not_found",
        "message": "Payment not found.",
        "field": "payment_id",
    }


async def test_errors_and_attempts_are_logged_without_card_data(client, session, caplog):
    caplog.set_level(logging.INFO)
    registration = await _registration(session)
    url = f"/registrations/{registration.id}/payments"

    await client.post(url, json={**CARD, "card_number": "4111 1111 1111 111x"})
    with processor(random_value=0.01):
        await client.post(url, json=CARD)

    assert "validation error" in caplog.text
    assert "payment attempt" in caplog.text
    for secret in ("4111 1111 1111", "4111111111111111", "12/40", "111x"):
        assert secret not in caplog.text
