import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import transaction


class Wallet(models.Model):
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('FROZEN', 'Frozen'),
        ('RESTRICTED', 'Restricted'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email}'s Wallet ({self.currency} {self.balance})"

    @transaction.atomic
    def credit(self, amount: Decimal, reference_type: str, reference_id: str = '', description: str = ''):
        if amount <= Decimal('0.00'):
            raise ValueError("Credit amount must be greater than zero.")
        if self.status != 'ACTIVE':
            raise ValueError(f"Wallet is currently {self.status.lower()}.")

        # Lock record for atomic update
        wallet = Wallet.objects.select_for_update().get(id=self.id)
        balance_before = wallet.balance
        wallet.balance += amount
        wallet.save(update_fields=['balance', 'updated_at'])

        ledger_entry = WalletTransaction.objects.create(
            wallet=wallet,
            transaction_type='CREDIT',
            amount=amount,
            balance_before=balance_before,
            balance_after=wallet.balance,
            reference_type=reference_type,
            reference_id=reference_id,
            description=description or f"Wallet credited with {wallet.currency} {amount}"
        )
        self.balance = wallet.balance
        return ledger_entry

    @transaction.atomic
    def debit(self, amount: Decimal, reference_type: str, reference_id: str = '', description: str = ''):
        if amount <= Decimal('0.00'):
            raise ValueError("Debit amount must be greater than zero.")
        if self.status != 'ACTIVE':
            raise ValueError(f"Wallet is currently {self.status.lower()}.")

        wallet = Wallet.objects.select_for_update().get(id=self.id)
        if wallet.balance < amount:
            raise ValueError("Insufficient wallet balance.")

        balance_before = wallet.balance
        wallet.balance -= amount
        wallet.save(update_fields=['balance', 'updated_at'])

        ledger_entry = WalletTransaction.objects.create(
            wallet=wallet,
            transaction_type='DEBIT',
            amount=amount,
            balance_before=balance_before,
            balance_after=wallet.balance,
            reference_type=reference_type,
            reference_id=reference_id,
            description=description or f"Wallet debited for {wallet.currency} {amount}"
        )
        self.balance = wallet.balance
        return ledger_entry


class WalletTransaction(models.Model):
    TRANSACTION_TYPE_CHOICES = (
        ('CREDIT', 'Credit (+)'),
        ('DEBIT', 'Debit (-)'),
    )

    REFERENCE_TYPE_CHOICES = (
        ('DEPOSIT', 'Add Money (Deposit)'),
        ('WITHDRAWAL', 'Withdrawal'),
        ('TRANSFER_SEND', 'P2P Send'),
        ('TRANSFER_RECEIVE', 'P2P Receive'),
        ('MERCHANT_PAYMENT', 'Merchant Purchase'),
        ('REFUND', 'Refund Credit'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='ledger_transactions')
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    balance_before = models.DecimalField(max_digits=14, decimal_places=2)
    balance_after = models.DecimalField(max_digits=14, decimal_places=2)
    reference_type = models.CharField(max_length=30, choices=REFERENCE_TYPE_CHOICES)
    reference_id = models.CharField(max_length=100, blank=True)
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.transaction_type} {self.amount} - {self.reference_type} ({self.created_at})"
