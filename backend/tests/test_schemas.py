import datetime as dt

import pytest
from pydantic import ValidationError

from app.schemas.payment import PaymentCreate, check_cvv, check_expiry, normalize_card_number
from app.schemas.student import StudentCreate

TODAY = dt.date(2026, 10, 26)
VALID = {"card_number": "4111 1111 1111 1111", "expiry_date": "12/30", "cvv": "123"}


def _error_fields(model, data) -> set[str]:
    with pytest.raises(ValidationError) as exc:
        model(**data)
    return {str(e["loc"][0]) for e in exc.value.errors()}


def _error_codes(fn, *args) -> str:
    with pytest.raises(Exception) as exc:
        fn(*args)
    return exc.value.type


def test_child_name_is_trimmed():
    assert StudentCreate(name="  Ava Lee  ").name == "Ava Lee"


@pytest.mark.parametrize("name", ["", "   ", "x" * 101])
def test_child_name_rejected(name):
    assert _error_fields(StudentCreate, {"name": name}) == {"name"}


def test_child_name_100_chars_accepted():
    assert len(StudentCreate(name="x" * 100).name) == 100


def test_card_number_spaces_removed():
    assert normalize_card_number("4111 1111 1111 1111") == "4111111111111111"


@pytest.mark.parametrize("value", ["", "4111", "4111 1111 1111 111a", "4" * 17, "４" * 16])
def test_card_number_rejected(value):
    assert _error_codes(normalize_card_number, value) == "invalid_card_number"


@pytest.mark.parametrize("value", ["01/27", "12/26", "10/26", "11/26"])
def test_expiry_accepted(value):
    assert check_expiry(value, TODAY) == value


def test_expiry_last_month_rejected():
    assert _error_codes(check_expiry, "09/26", TODAY) == "card_expired"


@pytest.mark.parametrize("value", ["", "1/27", "13/27", "00/27", "12-27", "12/2027", "ab/cd"])
def test_expiry_bad_format_rejected(value):
    assert _error_codes(check_expiry, value, TODAY) == "invalid_expiry_format"


@pytest.mark.parametrize("value", ["", "12", "1234", "12a", "١٢٣"])
def test_cvv_rejected(value):
    assert _error_codes(check_cvv, value) == "invalid_cvv"


def test_payment_valid_keeps_only_last4():
    payment = PaymentCreate(**VALID)
    assert payment.card_number == "4111111111111111"
    assert payment.card_last4 == "1111"


@pytest.mark.parametrize(
    ("field", "value"),
    [("card_number", "123"), ("expiry_date", "01/20"), ("cvv", "12")],
)
def test_payment_error_names_the_field(field, value):
    assert _error_fields(PaymentCreate, {**VALID, field: value}) == {field}


def test_payment_rejects_client_amount():
    assert _error_fields(PaymentCreate, {**VALID, "amount": 1}) == {"amount"}
