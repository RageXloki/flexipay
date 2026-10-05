from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from decimal import Decimal


class PaymentProvider(ABC):
    """
    Abstract Payment Provider Interface.
    Enforces a strict abstraction layer so the platform can seamlessly switch
    between Mock Sandbox, Razorpay, Stripe, or any banking integration.
    """

    @abstractmethod
    def create_payment(
        self,
        amount: Decimal,
        currency: str,
        customer_id: str,
        metadata: Optional[Dict[str, Any]] = None,
        idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """Initiate or prepare a payment order."""
        pass

    @abstractmethod
    def authorize_payment(
        self,
        payment_id: str,
        payment_method: str,
        payment_details: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Authorize the payment (e.g. verify PIN/OTP simulation or card token)."""
        pass

    @abstractmethod
    def capture_payment(
        self,
        payment_id: str,
        amount: Decimal
    ) -> Dict[str, Any]:
        """Capture the authorized funds."""
        pass

    @abstractmethod
    def refund_payment(
        self,
        payment_id: str,
        amount: Decimal,
        reason: str = ''
    ) -> Dict[str, Any]:
        """Process a full or partial refund."""
        pass

    @abstractmethod
    def verify_payment(self, payment_id: str) -> Dict[str, Any]:
        """Query provider to verify real-time status of payment."""
        pass
