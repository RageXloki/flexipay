from rest_framework import serializers
from decimal import Decimal
from .models import Wallet, WalletTransaction


class WalletSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = Wallet
        fields = ['id', 'user_email', 'user_name', 'balance', 'currency', 'status', 'updated_at']
        read_only_fields = ['id', 'balance', 'updated_at']


class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = [
            'id', 'transaction_type', 'amount', 'balance_before',
            'balance_after', 'reference_type', 'reference_id',
            'description', 'created_at'
        ]
        read_only_fields = [
            'id', 'transaction_type', 'amount', 'balance_before',
            'balance_after', 'reference_type', 'reference_id',
            'description', 'created_at'
        ]


class AddMoneySerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('1.00'))
    payment_method = serializers.ChoiceField(choices=['CARD', 'UPI', 'NET_BANKING'], default='CARD')
    card_id = serializers.UUIDField(required=False, allow_null=True)
    upi_id = serializers.CharField(required=False, allow_blank=True)


class WithdrawMoneySerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('1.00'))
    bank_account_id = serializers.UUIDField(required=False, allow_null=True)
