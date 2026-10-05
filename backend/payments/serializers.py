import uuid
from decimal import Decimal
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Transaction, CardToken, BankAccount, UPIAccount, PaymentRequest
from accounts.serializers import UserSerializer

User = get_user_model()


class CardTokenSerializer(serializers.ModelSerializer):
    masked_number = serializers.CharField(read_only=True)

    class Meta:
        model = CardToken
        fields = [
            'id', 'card_brand', 'cardholder_name', 'masked_number',
            'last_four_digits', 'expiry_month', 'expiry_year',
            'is_default', 'created_at'
        ]
        read_only_fields = ['id', 'masked_number', 'created_at']


class AddCardSerializer(serializers.Serializer):
    """
    Card Tokenization Request.
    Accepts raw card details strictly in memory to generate a secure token.
    CVV and full PAN are NEVER written to the database.
    """
    cardholder_name = serializers.CharField(max_length=150)
    card_number = serializers.CharField(max_length=19)
    expiry_month = serializers.IntegerField(min_value=1, max_value=12)
    expiry_year = serializers.IntegerField(min_value=2024, max_value=2040)
    cvv = serializers.CharField(max_length=4, write_only=True)
    is_default = serializers.BooleanField(default=False)

    def validate_card_number(self, value):
        clean_num = ''.join(value.split())
        if not clean_num.isdigit() or len(clean_num) < 13 or len(clean_num) > 19:
            raise serializers.ValidationError("Invalid card number format.")
        return clean_num

    def validate_cvv(self, value):
        if not value.isdigit() or len(value) not in (3, 4):
            raise serializers.ValidationError("Invalid CVV format.")
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        card_num = validated_data['card_number']
        last4 = card_num[-4:]

        # Detect brand
        if card_num.startswith('4'):
            brand = 'VISA'
        elif card_num.startswith(('51', '52', '53', '54', '55')):
            brand = 'MASTERCARD'
        elif card_num.startswith(('60', '65', '81', '82')):
            brand = 'RUPAY'
        elif card_num.startswith(('34', '37')):
            brand = 'AMEX'
        else:
            brand = 'OTHER'

        if validated_data.get('is_default'):
            CardToken.objects.filter(user=user).update(is_default=False)

        # Generate cryptographic token (simulating Stripe / PCI vault token)
        token = f"tok_sand_{uuid.uuid4().hex}"

        return CardToken.objects.create(
            user=user,
            card_token=token,
            cardholder_name=validated_data['cardholder_name'],
            card_brand=brand,
            last_four_digits=last4,
            expiry_month=validated_data['expiry_month'],
            expiry_year=validated_data['expiry_year'],
            is_default=validated_data.get('is_default', False)
        )


class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = [
            'id', 'account_holder_name', 'bank_name', 'masked_account_number',
            'ifsc_code', 'account_type', 'is_primary', 'is_verified', 'created_at'
        ]
        read_only_fields = ['id', 'is_verified', 'created_at']


class UPIAccountSerializer(serializers.ModelSerializer):
    qr_payload = serializers.CharField(read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = UPIAccount
        fields = ['id', 'upi_id', 'is_primary', 'qr_payload', 'user_name', 'created_at']
        read_only_fields = ['id', 'qr_payload', 'created_at']


class TransactionSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    receiver_name = serializers.CharField(source='receiver.full_name', read_only=True)
    receiver_email = serializers.EmailField(source='receiver.email', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_id', 'sender', 'sender_name', 'sender_email',
            'receiver', 'receiver_name', 'receiver_email', 'amount', 'fee',
            'currency', 'payment_method', 'description', 'status',
            'reference_id', 'failure_reason', 'is_flagged_fraud',
            'fraud_reason', 'created_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'transaction_id', 'sender', 'sender_name', 'sender_email',
            'receiver', 'receiver_name', 'receiver_email', 'fee', 'currency',
            'status', 'reference_id', 'failure_reason', 'is_flagged_fraud',
            'fraud_reason', 'created_at', 'completed_at'
        ]


class SendMoneySerializer(serializers.Serializer):
    recipient = serializers.CharField(help_text="Email, phone, or UPI ID of recipient")
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('1.00'))
    payment_method = serializers.ChoiceField(choices=['WALLET', 'UPI', 'CARD'], default='WALLET')
    note = serializers.CharField(max_length=255, required=False, allow_blank=True)
    card_id = serializers.UUIDField(required=False, allow_null=True)
    upi_pin = serializers.CharField(max_length=6, required=False, write_only=True)


class PaymentRequestSerializer(serializers.ModelSerializer):
    requester_name = serializers.CharField(source='requester.full_name', read_only=True)
    payer_name = serializers.CharField(source='payer.full_name', read_only=True)

    class Meta:
        model = PaymentRequest
        fields = [
            'id', 'requester', 'requester_name', 'payer', 'payer_name',
            'amount', 'note', 'status', 'expires_at', 'created_at'
        ]
        read_only_fields = ['id', 'requester', 'status', 'created_at']
