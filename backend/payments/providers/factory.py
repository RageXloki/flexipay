from django.conf import settings
from .base import PaymentProvider
from .mock_provider import MockPaymentProvider


def get_payment_provider() -> PaymentProvider:
    provider_type = getattr(settings, 'PAYMENT_PROVIDER', 'mock').lower()

    if provider_type in ('mock', 'sandbox', 'simulator'):
        return MockPaymentProvider()

    # Extensible design: Future Razorpay / Stripe integrations can be plugged in here
    # elif provider_type == 'razorpay':
    #     return RazorpayProvider(...)
    # elif provider_type == 'stripe':
    #     return StripeProvider(...)

    return MockPaymentProvider()
