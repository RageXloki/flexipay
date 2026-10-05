import datetime
from decimal import Decimal
from django.db import transaction as db_transaction, models
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Merchant, PaymentLink, Refund
from .serializers import MerchantSerializer, PaymentLinkSerializer, RefundSerializer
from payments.models import Transaction
from payments.serializers import TransactionSerializer
from payments.providers import get_payment_provider
from wallets.models import Wallet
from notifications.models import Notification


class MerchantProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        merchant = Merchant.objects.filter(user=request.user).first()
        if not merchant:
            # Auto-provision if user role is MERCHANT or let user initialize merchant profile
            if request.user.role == 'MERCHANT':
                merchant = Merchant.objects.create(
                    user=request.user,
                    business_name=f"{request.user.full_name}'s Store",
                    business_category='ECOMMERCE'
                )
            else:
                return Response({
                    "status": "error",
                    "message": "User is not registered as a merchant."
                }, status=status.HTTP_403_FORBIDDEN)

        return Response({
            "status": "success",
            "merchant": MerchantSerializer(merchant).data
        })

    def post(self, request):
        # Register or update merchant profile
        merchant = Merchant.objects.filter(user=request.user).first()
        data = request.data
        if merchant:
            serializer = MerchantSerializer(merchant, data=data, partial=True)
        else:
            request.user.role = 'MERCHANT'
            request.user.save(update_fields=['role'])
            serializer = MerchantSerializer(data=data)

        if serializer.is_valid():
            merchant_obj = serializer.save(user=request.user)
            return Response({
                "status": "success",
                "message": "Merchant profile saved successfully.",
                "merchant": MerchantSerializer(merchant_obj).data
            })

        return Response({
            "status": "error",
            "message": "Invalid merchant data.",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class MerchantDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        merchant = Merchant.objects.filter(user=request.user).first()
        if not merchant:
            return Response({"status": "error", "message": "Merchant not found."}, status=status.HTTP_404_NOT_FOUND)

        # Transactions where this merchant's user received money
        txns = Transaction.objects.filter(receiver=request.user)

        total_sales = txns.filter(status='SUCCESSFUL').aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')

        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_sales = txns.filter(status='SUCCESSFUL', created_at__gte=today_start).aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')

        success_count = txns.filter(status='SUCCESSFUL').count()
        failed_count = txns.filter(status='FAILED').count()

        refunds_total = Refund.objects.filter(merchant=merchant, status='COMPLETED').aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')

        # Recent transactions
        recent_txns = txns.select_related('sender')[:8]

        # 7-day revenue trend simulation
        trend_days = []
        for i in range(6, -1, -1):
            day_dt = timezone.now() - datetime.timedelta(days=i)
            day_start = day_dt.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
            day_vol = txns.filter(status='SUCCESSFUL', created_at__range=(day_start, day_end)).aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')
            trend_days.append({
                "date": day_dt.strftime('%b %d'),
                "volume": float(day_vol)
            })

        return Response({
            "status": "success",
            "metrics": {
                "total_sales": str(total_sales),
                "today_sales": str(today_sales),
                "successful_transactions": success_count,
                "failed_transactions": failed_count,
                "refunds_issued": str(refunds_total),
            },
            "revenue_chart": trend_days,
            "recent_transactions": TransactionSerializer(recent_txns, many=True).data
        })


class PaymentLinkListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        merchant = Merchant.objects.filter(user=request.user).first()
        if not merchant:
            return Response({"status": "error", "message": "Merchant profile required."}, status=status.HTTP_403_FORBIDDEN)

        links = PaymentLink.objects.filter(merchant=merchant)
        return Response({
            "status": "success",
            "payment_links": PaymentLinkSerializer(links, many=True).data
        })

    def post(self, request):
        merchant = Merchant.objects.filter(user=request.user).first()
        if not merchant:
            merchant = Merchant.objects.create(
                user=request.user,
                business_name=f"{request.user.full_name}'s Store",
                business_category='ECOMMERCE'
            )

        serializer = PaymentLinkSerializer(data=request.data)
        if serializer.is_valid():
            link = serializer.save(merchant=merchant)
            return Response({
                "status": "success",
                "message": "Payment link created.",
                "payment_link": PaymentLinkSerializer(link).data
            }, status=status.HTTP_201_CREATED)

        return Response({
            "status": "error",
            "message": "Failed to create payment link.",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class PublicPaymentLinkDetailView(APIView):
    """
    Public checkout page lookup.
    Allows customers to view invoice / checkout details without prior login.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, link_code):
        link = PaymentLink.objects.filter(link_code=link_code).select_related('merchant', 'merchant__user').first()
        if not link:
            return Response({"status": "error", "message": "Payment link not found."}, status=status.HTTP_404_NOT_FOUND)

        if link.is_expired or link.status != 'ACTIVE':
            return Response({
                "status": "error",
                "message": "This payment link has expired or is no longer active."
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "status": "success",
            "payment_link": PaymentLinkSerializer(link).data,
            "merchant": {
                "business_name": link.merchant.business_name,
                "business_category": link.merchant.get_business_category_display(),
                "website": link.merchant.website,
            }
        })


class PublicPaymentLinkProcessView(APIView):
    """
    Processes customer checkout on a payment link.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, link_code):
        link = PaymentLink.objects.filter(link_code=link_code, status='ACTIVE').first()
        if not link:
            return Response({"status": "error", "message": "Invalid or expired payment link."}, status=status.HTTP_404_NOT_FOUND)

        amount = link.amount
        if not amount:
            raw_amount = request.data.get('amount')
            if not raw_amount:
                return Response({"status": "error", "message": "Please specify the payment amount."}, status=status.HTTP_400_BAD_REQUEST)
            amount = Decimal(str(raw_amount))

        method = request.data.get('payment_method', 'CARD')
        customer_name = request.data.get('customer_name', 'Guest Customer')
        customer_email = request.data.get('customer_email', 'guest@customer.local')

        provider = get_payment_provider()
        provider_order = provider.create_payment(
            amount=amount,
            currency=link.currency,
            customer_id=customer_email,
            metadata={'link_code': link_code, 'merchant_id': str(link.merchant.id)}
        )

        auth_resp = provider.authorize_payment(
            payment_id=provider_order['provider_payment_id'],
            payment_method=method,
            payment_details={'last_four': '4242'}
        )

        if not auth_resp.get('success'):
            return Response({
                "status": "error",
                "message": auth_resp.get('message', "Card authorization failed in sandbox.")
            }, status=status.HTTP_400_BAD_REQUEST)

        with db_transaction.atomic():
            txn = Transaction.objects.create(
                sender=request.user if request.user.is_authenticated else None,
                receiver=link.merchant.user,
                amount=amount,
                currency=link.currency,
                payment_method=method,
                description=f"Payment for {link.title} via {method}",
                status='SUCCESSFUL',
                reference_id=provider_order['provider_payment_id'],
                metadata={
                    'link_code': link_code,
                    'customer_name': customer_name,
                    'customer_email': customer_email
                }
            )

            # Credit merchant wallet
            merchant_wallet, _ = Wallet.objects.get_or_create(user=link.merchant.user)
            merchant_wallet.credit(
                amount=amount,
                reference_type='MERCHANT_PAYMENT',
                reference_id=txn.transaction_id,
                description=f"Received via Payment Link: {link.title}"
            )

            Notification.objects.create(
                user=link.merchant.user,
                title="Payment Received via Link",
                message=f"Received ₹{amount} from {customer_name} ({link.title}).",
                notification_type='PAYMENT_RECEIVED',
                reference_id=txn.transaction_id
            )

        return Response({
            "status": "success",
            "message": "Payment completed successfully.",
            "transaction": TransactionSerializer(txn).data
        })


class RefundCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        merchant = Merchant.objects.filter(user=request.user).first()
        if not merchant and request.user.role != 'ADMIN':
            return Response({"status": "error", "message": "Only merchants or administrators can issue refunds."}, status=status.HTTP_403_FORBIDDEN)

        transaction_id = request.data.get('transaction_id')
        amount_raw = request.data.get('amount')
        reason = request.data.get('reason', 'Customer return / dissatisfaction')

        txn = Transaction.objects.filter(
            models.Q(transaction_id=transaction_id) | models.Q(id=transaction_id if len(transaction_id) == 36 else None),
            status='SUCCESSFUL'
        ).first()

        if not txn:
            return Response({"status": "error", "message": "Transaction not eligible for refund."}, status=status.HTTP_404_NOT_FOUND)

        refund_amount = Decimal(str(amount_raw)) if amount_raw else txn.amount
        if refund_amount <= 0 or refund_amount > txn.amount:
            return Response({
                "status": "error",
                "message": f"Refund amount must be between ₹1 and ₹{txn.amount}."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Debit merchant wallet & credit sender wallet if exists
        merchant_wallet, _ = Wallet.objects.get_or_create(user=txn.receiver)
        if merchant_wallet.balance < refund_amount:
            return Response({
                "status": "error",
                "message": "Insufficient merchant wallet balance to fund refund."
            }, status=status.HTTP_400_BAD_REQUEST)

        provider = get_payment_provider()
        provider_refund = provider.refund_payment(
            payment_id=txn.reference_id or txn.transaction_id,
            amount=refund_amount,
            reason=reason
        )

        with db_transaction.atomic():
            merchant_wallet.debit(
                amount=refund_amount,
                reference_type='REFUND',
                reference_id=txn.transaction_id,
                description=f"Refund issued for {txn.transaction_id}"
            )

            if txn.sender:
                customer_wallet, _ = Wallet.objects.get_or_create(user=txn.sender)
                customer_wallet.credit(
                    amount=refund_amount,
                    reference_type='REFUND',
                    reference_id=txn.transaction_id,
                    description=f"Refund received for {txn.transaction_id}"
                )
                Notification.objects.create(
                    user=txn.sender,
                    title="Refund Credited",
                    message=f"Refund of ₹{refund_amount} processed for transaction {txn.transaction_id}.",
                    notification_type='REFUND',
                    reference_id=txn.transaction_id
                )

            txn.status = 'REFUNDED'
            txn.save(update_fields=['status'])

            refund_obj = Refund.objects.create(
                transaction=txn,
                merchant=merchant or Merchant.objects.filter(user=txn.receiver).first(),
                amount=refund_amount,
                refund_type='FULL' if refund_amount == txn.amount else 'PARTIAL',
                reason=reason,
                status='COMPLETED'
            )

        return Response({
            "status": "success",
            "message": f"Refund of ₹{refund_amount} processed successfully.",
            "refund": RefundSerializer(refund_obj).data
        })
