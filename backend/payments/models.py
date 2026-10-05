import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator


def generate_transaction_id():
    # Human-readable format: TXN-2026-8F92K31
    random_part = uuid.uuid4().hex[:8].upper()
    return f"TXN-2026-{random_part}"


class CardToken(models.Model):
    """
    PCI-DSS Compliant Tokenized Card Storage.
    NEVER STORES raw card numbers or CVV.
    Only stores token, cardholder name, last 4 digits, brand and expiry.
    """
    CARD_BRANDS = (
        ('VISA', 'Visa'),
        ('MASTERCARD', 'Mastercard'),
        ('RUPAY', 'RuPay'),
        ('AMEX', 'American Express'),
        ('OTHER', 'Other Card'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_cards')
    card_token = models.CharField(max_length=128, unique=True, db_index=True)
    cardholder_name = models.CharField(max_length=150)
    card_brand = models.CharField(max_length=20, choices=CARD_BRANDS, default='VISA')
    last_four_digits = models.CharField(max_length=4)
    expiry_month = models.IntegerField()
    expiry_year = models.IntegerField()
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_default', '-created_at']

    @property
    def masked_number(self):
        return f"•••• •••• •••• {self.last_four_digits}"

    def __str__(self):
        return f"{self.card_brand} {self.masked_number} ({self.cardholder_name})"


class BankAccount(models.Model):
    ACCOUNT_TYPES = (
        ('SAVINGS', 'Savings Account'),
        ('CURRENT', 'Current Account'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bank_accounts')
    account_holder_name = models.CharField(max_length=150)
    bank_name = models.CharField(max_length=150)
    masked_account_number = models.CharField(max_length=30)
    ifsc_code = models.CharField(max_length=20)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES, default='SAVINGS')
    is_primary = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_primary', '-created_at']

    def __str__(self):
        return f"{self.bank_name} ({self.masked_account_number})"


class UPIAccount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='upi_accounts')
    upi_id = models.CharField(max_length=100, unique=True, db_index=True)
    linked_bank = models.ForeignKey(BankAccount, on_delete=models.SET_NULL, null=True, blank=True, related_name='upi_links')
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_primary', '-created_at']

    @property
    def qr_payload(self):
        return f"upi://pay?pa={self.upi_id}&pn={self.user.full_name}&cu=INR"

    def __str__(self):
        return self.upi_id


class Transaction(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('SUCCESSFUL', 'Successful'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
        ('REFUNDED', 'Refunded'),
    )

    PAYMENT_METHOD_CHOICES = (
        ('WALLET', 'PayFlow Wallet'),
        ('UPI', 'UPI Simulation'),
        ('CARD', 'Saved Card (Tokenized)'),
        ('NET_BANKING', 'Net Banking Sandbox'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction_id = models.CharField(max_length=50, unique=True, default=generate_transaction_id, db_index=True)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_transactions'
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='received_transactions'
    )
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    currency = models.CharField(max_length=10, default='INR')
    payment_method = models.CharField(max_length=30, choices=PAYMENT_METHOD_CHOICES, default='WALLET')
    description = models.CharField(max_length=255, default='Payment')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PROCESSING', db_index=True)
    reference_id = models.CharField(max_length=100, blank=True, db_index=True)
    failure_reason = models.TextField(blank=True, default='')

    # Idempotency support to prevent duplicate charges
    idempotency_key = models.CharField(max_length=128, unique=True, null=True, blank=True, db_index=True)

    # Fraud simulation flags
    is_flagged_fraud = models.BooleanField(default=False)
    fraud_reason = models.CharField(max_length=255, blank=True, default='')

    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def mark_successful(self, reference_id=''):
        self.status = 'SUCCESSFUL'
        self.completed_at = timezone.now()
        if reference_id:
            self.reference_id = reference_id
        self.save(update_fields=['status', 'completed_at', 'reference_id'])

    def mark_failed(self, reason='Payment processing failed'):
        self.status = 'FAILED'
        self.completed_at = timezone.now()
        self.failure_reason = reason
        self.save(update_fields=['status', 'completed_at', 'failure_reason'])

    def __str__(self):
        return f"{self.transaction_id}: {self.currency} {self.amount} ({self.status})"


class PaymentRequest(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
        ('EXPIRED', 'Expired'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='outgoing_payment_requests')
    payer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='incoming_payment_requests')
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    note = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    transaction = models.OneToOneField(Transaction, on_delete=models.SET_NULL, null=True, blank=True, related_name='payment_request_source')
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Request {self.amount} from {self.payer.email} by {self.requester.email}"
