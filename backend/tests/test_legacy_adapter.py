from dataclasses import replace
from unittest.mock import patch

from app.legacy.adapter import ChargeRequest, build_payload, charge

REQ = ChargeRequest(
    student_name="Ava Lee",
    parent_name="Sam Lee",
    cost_cents=4550,
    card_number="4111 1111 1111 1111",
    expiry_date="12/30",
    cvv="123",
    school_id=1,
    activity_id=7,
)


def test_payload_field_types():
    payload = build_payload(REQ)
    assert type(payload["amount"]) is float
    assert payload["amount"] == 45.5
    assert payload["card_number"] == "4111111111111111"
    assert payload["school_id"] == "1"
    assert payload["activity_id"] == "7"
    for field in ("student_name", "parent_name", "expiry_date", "cvv"):
        assert type(payload[field]) is str


async def test_charge_success():
    with (
        patch("app.legacy.processor.time.sleep"),
        patch("app.legacy.processor.random.random", return_value=0.5),
        patch("app.legacy.processor.random.randint", return_value=1234),
    ):
        res = await charge(REQ)
    assert res.success
    assert res.transaction_id.startswith("TX-")
    assert res.transaction_id.endswith("-1234")


async def test_charge_declined():
    with (
        patch("app.legacy.processor.time.sleep"),
        patch("app.legacy.processor.random.random", return_value=0.01),
    ):
        res = await charge(REQ)
    assert not res.success
    assert "declined" in res.error_message


async def test_charge_rejects_bad_card_without_sleeping():
    bad = replace(REQ, card_number="123")
    with patch("app.legacy.processor.time.sleep") as sleep:
        res = await charge(bad)
    assert not res.success
    sleep.assert_not_called()
