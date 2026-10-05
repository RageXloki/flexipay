import uuid
import secrets
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils import timezone


def generate_link_code():
    return f"pay_{secrets.token_hex(4)}"


def generate_refund_reference():
    return f"REF-2026-{secrets.token_hex(4).upper()}"


def generate_business_id():
    return f"BIZ-{uuid.uuid4().hex[:8].upper()}"


class Merchant(models.Model):
    BUSINESS_CATEGORIES = (
        ('ECOMMERCE', 'E-Commerce & Retail'),
        ('TECH_SAAS', 'Technology & SaaS'),
        ('FOOD_DINING', 'Food & Dining'),
        ('EDUCATION', 'Education & EdTech'),
        ('HEALTHCARE', 'Healthcare & Wellness'),
        ('SERVICES', 'Professional Services'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='merchant_profile')
    business_name = models.CharField(max_length=200)
    business_category = models.CharField(max_length=50, choices=BUSINESS_CATEGORIES, default='ECOMMERCE')
    business_id = models.CharField(max_length=50, unique=True, default=generate_business_id)
    website = models.URLField(blank=True, default='')
    is_verified = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.business_name} ({self.business_id})"


class PaymentLink(models.Model):
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('PAID', 'Paid / Completed'),
        ('EXPIRED', 'Expired'),
        ('DISABLED', 'Disabled'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='payment_links')
    link_code = models.CharField(max_length=32, unique=True, default=generate_link_code, db_index=True)
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True, default='')
    amount = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def is_expired(self):
        if self.expires_at and timezone.now() > self.expires_at:
            return True
        return False

    def __str__(self):
        return f"{self.title} - {self.link_code} ({self.status})"


class Refund(models.Model):
    STATUS_CHOICES = (
        ('COMPLETED', 'Completed'),
        ('PENDING', 'Pending'),
        ('FAILED', 'Failed'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey('payments.Transaction', on_delete=models.CASCADE, related_name='refunds')
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='issued_refunds')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    refund_type = models.CharField(max_length=20, default='FULL')
    reason = models.CharField(max_length=255, default='Customer requested refund')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='COMPLETED')
    refund_reference = models.CharField(max_length=50, unique=True, default=generate_refund_reference)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.refund_reference}: INR {self.amount} for {self.transaction.transaction_id}"
