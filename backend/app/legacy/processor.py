# This simulates the legacy payment API that you'll need to integrate with
# You should include this in your project and call it as needed
import time
import random
from dataclasses import dataclass
from typing import Optional


@dataclass
class PaymentResponse:
    success: bool
    transaction_id: Optional[str] = None
    error_message: Optional[str] = None


class LegacyPaymentProcessor:
    """
    Legacy payment processor that accepts payments and provides responses.
    This is a simulation of an external API you'd need to work with.
    """

    def process_payment(self, payment_data):
        """
        Process a payment with the following required fields:
        - student_name: str
        - parent_name: str
        - amount: float
        - card_number: str (must be 16 digits)
        - expiry_date: str (format: MM/YY)
        - cvv: str (must be 3 digits)
        - school_id: str
        - activity_id: str
        """
        required_fields = [
            'student_name', 'parent_name', 'amount',
            'card_number', 'expiry_date', 'cvv',
            'school_id', 'activity_id'
        ]

        # Validate all required fields exist
        for field in required_fields:
            if field not in payment_data:
                return PaymentResponse(
                    success=False,
                    error_message=f"Missing required field: {field}"
                )

        # Validate card number (must be 16 digits)
        card_num = payment_data['card_number'].replace(' ', '')
        if not (card_num.isdigit() and len(card_num) == 16):
            return PaymentResponse(
                success=False,
                error_message="Invalid card number. Must be 16 digits."
            )

        # Validate expiry date format (MM/YY)
        if not self._validate_expiry_format(payment_data['expiry_date']):
            return PaymentResponse(
                success=False,
                error_message="Invalid expiry date format. Use MM/YY."
            )

        # Validate CVV (must be 3 digits)
        if not (payment_data['cvv'].isdigit() and len(payment_data['cvv']) == 3):
            return PaymentResponse(
                success=False,
                error_message="Invalid CVV. Must be 3 digits."
            )

        # Validate amount is positive
        if not isinstance(payment_data['amount'], (int, float)) or payment_data['amount'] <= 0:
            return PaymentResponse(
                success=False,
                error_message="Payment amount must be a positive number."
            )

        # Simulate processing time
        time.sleep(1.5)

        # Simulate occasional payment failures
        if random.random() < 0.1:  # 10% chance of failure
            return PaymentResponse(
                success=False,
                error_message="Payment declined by processor. Please try again."
            )

        # Generate a transaction ID for successful payments
        transaction_id = f"TX-{int(time.time())}-{random.randint(1000, 9999)}"

        return PaymentResponse(
            success=True,
            transaction_id=transaction_id
        )

    def _validate_expiry_format(self, expiry):
        """Validate the expiry date is in MM/YY format."""
        if not isinstance(expiry, str) or len(expiry) != 5:
            return False

        if expiry[2] != '/':
            return False

        month, year = expiry.split('/')
        if not (month.isdigit() and year.isdigit()):
            return False

        month_num = int(month)
        if month_num < 1 or month_num > 12:
            return False

        return True
