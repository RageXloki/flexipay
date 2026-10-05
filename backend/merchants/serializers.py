from rest_framework import serializers
from decimal import Decimal
from .models import Merchant, PaymentLink, Refund
from payments.serializers import TransactionSerializer


class MerchantSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = Merchant
        fields = [
            'id', 'user_email', 'user_name', 'business_name',
            'business_category', 'business_id', 'website',
            'is_verified', 'created_at'
        ]
        read_only_fields = ['id', 'business_id', 'is_verified', 'created_at']


class PaymentLinkSerializer(serializers.ModelSerializer):
    merchant_name = serializers.CharField(source='merchant.business_name', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    checkout_url = serializers.SerializerMethodField()

    class Meta:
        model = PaymentLink
        fields = [
            'id', 'link_code', 'merchant', 'merchant_name', 'title',
            'description', 'amount', 'currency', 'status',
            'expires_at', 'is_expired', 'checkout_url', 'created_at'
        ]
        read_only_fields = ['id', 'link_code', 'merchant', 'status', 'created_at']

    def get_checkout_url(self, obj):
        return f"/pay/{obj.link_code}"


class RefundSerializer(serializers.ModelSerializer):
    transaction_id = serializers.CharField(source='transaction.transaction_id', read_only=True)

    class Meta:
        model = Refund
        fields = [
            'id', 'transaction', 'transaction_id', 'amount',
            'refund_type', 'reason', 'status', 'refund_reference',
            'created_at'
        ]
        read_only_fields = ['id', 'refund_reference', 'status', 'created_at']
