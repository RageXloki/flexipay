import datetime
from decimal import Decimal
from typing import Tuple
from django.conf import settings
from django.utils import timezone
from .models import Transaction


class FraudDetector:
    """
    Educational Fraud Detection Simulation.
    Flags suspicious payment behaviors based on fintech risk rules:
    - High-value anomalies (exceeds threshold)
    - High frequency velocity bursts
    - Repeated recent failures
    """

    @staticmethod
    def evaluate_payment(sender, amount: Decimal) -> Tuple[bool, str]:
        if not sender:
            return False, ""

        # Rule 1: High Transaction Value
        max_limit = Decimal(str(getattr(settings, 'FRAUD_MAX_AMOUNT_LIMIT', 50000.0)))
        if amount > max_limit:
            return True, f"High-value transaction warning: Amount ₹{amount} exceeds standard single-transaction threshold of ₹{max_limit}."

        # Rule 2: Rapid Burst Frequency Check (Velocity)
        window_seconds = getattr(settings, 'FRAUD_BURST_TIME_WINDOW_SECONDS', 30)
        since_time = timezone.now() - datetime.timedelta(seconds=window_seconds)
        recent_count = Transaction.objects.filter(
            sender=sender,
            created_at__gte=since_time
        ).count()

        burst_limit = getattr(settings, 'FRAUD_MAX_BURST_ATTEMPTS', 4)
        if recent_count >= burst_limit:
            return True, f"High-velocity burst: {recent_count} transactions initiated in under {window_seconds} seconds."

        # Rule 3: Multiple Consecutive Failed Payments
        failed_count = Transaction.objects.filter(
            sender=sender,
            status='FAILED',
            created_at__gte=timezone.now() - datetime.timedelta(minutes=10)
        ).count()
        if failed_count >= 3:
            return True, f"Multiple failed payment attempts detected ({failed_count} failures in 10 minutes)."

        return False, ""
