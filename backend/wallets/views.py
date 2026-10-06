from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction as db_transaction
from .models import Wallet, WalletTransaction
from .serializers import (
    WalletSerializer,
    WalletTransactionSerializer,
    AddMoneySerializer,
    WithdrawMoneySerializer,
)
from payments.models import Transaction
from payments.providers import get_payment_provider
from notifications.models import Notification


class WalletDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        wallet, _ = Wallet.objects.get_or_create(user=request.user, defaults={'balance': 0.00})
        return Response({
            "status": "success",
            "wallet": WalletSerializer(wallet).data
        })


class WalletLedgerTransactionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        wallet, _ = Wallet.objects.get_or_create(user=request.user, defaults={'balance': 0.00})
        transactions = wallet.ledger_transactions.all()[:50]
        return Response({
            "status": "success",
            "count": transactions.count(),
            "results": WalletTransactionSerializer(transactions, many=True).data
        })


class AddMoneyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AddMoneySerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "message": "Invalid payment parameters.",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        amount = serializer.validated_data['amount']
        method = serializer.validated_data['payment_method']
        wallet, _ = Wallet.objects.get_or_create(user=request.user)

        # Idempotency check header
        idempotency_key = request.headers.get('Idempotency-Key')
        if idempotency_key:
            existing_txn = Transaction.objects.filter(idempotency_key=idempotency_key).first()
            if existing_txn:
                return Response({
                    "status": "success",
                    "message": "Transaction already processed.",
                    "transaction_id": existing_txn.transaction_id,
                    "new_balance": str(wallet.balance)
                }, status=status.HTTP_200_OK)

        provider = get_payment_provider()
        provider_order = provider.create_payment(
            amount=amount,
            currency=wallet.currency,
            customer_id=str(request.user.id),
            metadata={'action': 'WALLET_TOPUP', 'method': method},
            idempotency_key=idempotency_key
        )

        auth_result = provider.authorize_payment(
            payment_id=provider_order['provider_payment_id'],
            payment_method=method,
            payment_details={'last_four': '4242'}
        )

        if not auth_result.get('success'):
            return Response({
                "status": "error",
                "message": auth_result.get('message', "Top-up declined by sandbox gateway."),
            }, status=status.HTTP_400_BAD_REQUEST)

        with db_transaction.atomic():
            # Create Transaction record
            txn = Transaction.objects.create(
                sender=None,  # External funding source
                receiver=request.user,
                amount=amount,
                currency=wallet.currency,
                payment_method=method,
                description=f"Add Money to Wallet via {method.replace('_', ' ').title()}",
                status='SUCCESSFUL',
                reference_id=provider_order['provider_payment_id'],
                idempotency_key=idempotency_key,
                metadata={'provider_order': provider_order}
            )

            # Credit Wallet
            wallet.credit(
                amount=amount,
                reference_type='DEPOSIT',
                reference_id=txn.transaction_id,
                description=f"Top-up of ₹{amount} via {method.replace('_', ' ').title()}"
            )

            # Notify user
            Notification.objects.create(
                user=request.user,
                title="Wallet Credited",
                message=f"₹{amount} successfully added to your FlexiPay wallet.",
                notification_type='PAYMENT_RECEIVED',
                reference_id=txn.transaction_id
            )

        return Response({
            "status": "success",
            "message": f"Successfully added ₹{amount} to wallet.",
            "transaction_id": txn.transaction_id,
            "new_balance": str(wallet.balance)
        }, status=status.HTTP_200_OK)


class WithdrawMoneyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = WithdrawMoneySerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "message": "Invalid withdrawal parameters.",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        amount = serializer.validated_data['amount']
        wallet, _ = Wallet.objects.get_or_create(user=request.user)

        if wallet.balance < amount:
            return Response({
                "status": "error",
                "message": f"Insufficient wallet balance. Available: ₹{wallet.balance}"
            }, status=status.HTTP_400_BAD_REQUEST)

        with db_transaction.atomic():
            txn = Transaction.objects.create(
                sender=request.user,
                receiver=None,
                amount=amount,
                currency=wallet.currency,
                payment_method='NET_BANKING',
                description="Wallet Withdrawal to Verified Bank Account",
                status='SUCCESSFUL',
                reference_id=f"WITHDRAW_{amount}"
            )

            wallet.debit(
                amount=amount,
                reference_type='WITHDRAWAL',
                reference_id=txn.transaction_id,
                description=f"Withdrawal of ₹{amount} to Bank Account"
            )

            Notification.objects.create(
                user=request.user,
                title="Withdrawal Processed",
                message=f"₹{amount} transferred from wallet to your bank account.",
                notification_type='PAYMENT_SENT',
                reference_id=txn.transaction_id
            )

        return Response({
            "status": "success",
            "message": f"Successfully initiated withdrawal of ₹{amount} to your bank account.",
            "transaction_id": txn.transaction_id,
            "new_balance": str(wallet.balance)
        }, status=status.HTTP_200_OK)
