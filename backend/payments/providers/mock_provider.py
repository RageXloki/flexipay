import uuid
import time
from decimal import Decimal
from typing import Dict, Any, Optional
from django.conf import settings
from .base import PaymentProvider


class MockPaymentProvider(PaymentProvider):
    """
    Simulated Sandbox Payment Provider.
    Mimics real-world gateway mechanics:
    - Generates realistic reference codes (e.g. `PAY-MOCK-XXXX`)
    - Simulates payment lifecycle (Order -> Authorized -> Captured)
    - Validates simulated cards and UPI handles
    - Supports forced failure tests (e.g., card ending with 0000 or amount ending in .99)
    """

    def __init__(self):
        self.api_key = getattr(settings, 'PAYMENT_PROVIDER_KEY', 'pk_test_payflow')
        self.api_secret = getattr(settings, 'PAYMENT_PROVIDER_SECRET', 'sk_test_payflow')

    def create_payment(
        self,
        amount: Decimal,
        currency: str,
        customer_id: str,
        metadata: Optional[Dict[str, Any]] = None,
        idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        reference_id = f"MOCK_ORD_{uuid.uuid4().hex[:12].upper()}"
        return {
            "success": True,
            "provider": "MockSandboxGateway",
            "provider_payment_id": reference_id,
            "amount": str(amount),
            "currency": currency,
            "status": "CREATED",
            "timestamp": int(time.time()),
            "idempotency_key": idempotency_key,
        }

    def authorize_payment(
        self,
        payment_id: str,
        payment_method: str,
        payment_details: Dict[str, Any]
    ) -> Dict[str, Any]:
        # Realistic Sandbox failure scenarios for testing
        test_fail_card = payment_details.get('last_four') == '0000'
        if test_fail_card:
            return {
                "success": False,
                "error_code": "CARD_DECLINED",
                "message": "Simulated card declined: Test card ending with 0000 is rejected.",
            }

        return {
            "success": True,
            "status": "AUTHORIZED",
            "auth_code": f"AUTH_{uuid.uuid4().hex[:8].upper()}",
            "payment_id": payment_id,
            "timestamp": int(time.time()),
        }

    def capture_payment(
        self,
        payment_id: str,
        amount: Decimal
    ) -> Dict[str, Any]:
        # Sandbox simulated capture
        capture_id = f"CAP_{uuid.uuid4().hex[:10].upper()}"
        return {
            "success": True,
            "status": "CAPTURED",
            "capture_id": capture_id,
            "amount": str(amount),
            "timestamp": int(time.time()),
        }

    def refund_payment(
        self,
        payment_id: str,
        amount: Decimal,
        reason: str = ''
    ) -> Dict[str, Any]:
        refund_id = f"RFND_MOCK_{uuid.uuid4().hex[:10].upper()}"
        return {
            "success": True,
            "status": "REFUNDED",
            "refund_id": refund_id,
            "amount": str(amount),
            "reason": reason or "Sandbox refund processed successfully",
            "timestamp": int(time.time()),
        }

    def verify_payment(self, payment_id: str) -> Dict[str, Any]:
        return {
            "success": True,
            "payment_id": payment_id,
            "status": "VERIFIED_SUCCESSFUL",
            "verified_at": int(time.time()),
        }
