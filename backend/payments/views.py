import datetime
from decimal import Decimal
from django.db import transaction as db_transaction, models
from django.utils import timezone
from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model

from .models import Transaction, CardToken, BankAccount, UPIAccount, PaymentRequest
from .serializers import (
    TransactionSerializer,
    CardTokenSerializer,
    AddCardSerializer,
    BankAccountSerializer,
    UPIAccountSerializer,
    SendMoneySerializer,
    PaymentRequestSerializer,
)
from .fraud_detector import FraudDetector
from .providers import get_payment_provider
from wallets.models import Wallet
from notifications.models import Notification

User = get_user_model()


class SendMoneyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SendMoneySerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "message": "Invalid payment parameters.",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        recipient_input = serializer.validated_data['recipient'].strip()
        amount = serializer.validated_data['amount']
        method = serializer.validated_data['payment_method']
        note = serializer.validated_data.get('note', 'Transfer')

        # Idempotency Protection
        idempotency_key = request.headers.get('Idempotency-Key')
        if idempotency_key:
            existing = Transaction.objects.filter(idempotency_key=idempotency_key).first()
            if existing:
                return Response({
                    "status": "success",
                    "message": "Transaction already executed (Idempotency matched).",
                    "transaction": TransactionSerializer(existing).data
                }, status=status.HTTP_200_OK)

        # Resolve recipient
        receiver = None
        if '@' in recipient_input:
            # Check UPI ID first
            upi_obj = UPIAccount.objects.filter(upi_id__iexact=recipient_input).first()
            if upi_obj:
                receiver = upi_obj.user
            else:
                receiver = User.objects.filter(email__iexact=recipient_input).first()
        else:
            # Try phone
            receiver = User.objects.filter(phone_number__icontains=recipient_input).first()

        if not receiver:
            return Response({
                "status": "error",
                "message": f"Recipient '{recipient_input}' not found. Please enter a valid email, phone number, or UPI ID."
            }, status=status.HTTP_404_NOT_FOUND)

        if receiver == request.user:
            return Response({
                "status": "error",
                "message": "You cannot send money to yourself."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Evaluate Fraud Detection Rule Simulation
        is_fraud_flagged, fraud_reason = FraudDetector.evaluate_payment(request.user, amount)

        sender_wallet, _ = Wallet.objects.get_or_create(user=request.user)
        receiver_wallet, _ = Wallet.objects.get_or_create(user=receiver)

        # Handle Method Specific Logic
        if method == 'WALLET':
            if sender_wallet.balance < amount:
                return Response({
                    "status": "error",
                    "message": f"Insufficient wallet balance. You have ₹{sender_wallet.balance}, required: ₹{amount}."
                }, status=status.HTTP_400_BAD_REQUEST)

        # Execute Transaction Atomically
        with db_transaction.atomic():
            txn = Transaction.objects.create(
                sender=request.user,
                receiver=receiver,
                amount=amount,
                currency=sender_wallet.currency,
                payment_method=method,
                description=note or f"Payment to {receiver.full_name}",
                status='PROCESSING',
                idempotency_key=idempotency_key,
                is_flagged_fraud=is_fraud_flagged,
                fraud_reason=fraud_reason,
                metadata={'recipient_input': recipient_input}
            )

            if method == 'WALLET':
                sender_wallet.debit(
                    amount=amount,
                    reference_type='TRANSFER_SEND',
                    reference_id=txn.transaction_id,
                    description=f"Sent to {receiver.full_name}"
                )
                receiver_wallet.credit(
                    amount=amount,
                    reference_type='TRANSFER_RECEIVE',
                    reference_id=txn.transaction_id,
                    description=f"Received from {request.user.full_name}"
                )
                txn.mark_successful(reference_id=f"WAL_XFER_{txn.transaction_id}")

            elif method in ('UPI', 'CARD'):
                provider = get_payment_provider()
                provider_resp = provider.create_payment(
                    amount=amount,
                    currency=sender_wallet.currency,
                    customer_id=str(request.user.id),
                    idempotency_key=idempotency_key
                )
                auth_resp = provider.authorize_payment(
                    payment_id=provider_resp['provider_payment_id'],
                    payment_method=method,
                    payment_details={'last_four': '4242'}
                )

                if auth_resp.get('success'):
                    # In sandbox, automatically credit receiver's wallet
                    receiver_wallet.credit(
                        amount=amount,
                        reference_type='TRANSFER_RECEIVE',
                        reference_id=txn.transaction_id,
                        description=f"Payment received via {method}"
                    )
                    txn.mark_successful(reference_id=provider_resp['provider_payment_id'])
                else:
                    txn.mark_failed(auth_resp.get('message', 'Payment authorization failed'))
                    return Response({
                        "status": "error",
                        "message": "Payment failed: " + auth_resp.get('message', 'Authorization declined.'),
                        "transaction": TransactionSerializer(txn).data
                    }, status=status.HTTP_400_BAD_REQUEST)

            # Notifications
            Notification.objects.create(
                user=request.user,
                title="Money Sent",
                message=f"You sent ₹{amount} to {receiver.full_name}.",
                notification_type='PAYMENT_SENT',
                reference_id=txn.transaction_id
            )

            Notification.objects.create(
                user=receiver,
                title="Money Received",
                message=f"You received ₹{amount} from {request.user.full_name}.",
                notification_type='PAYMENT_RECEIVED',
                reference_id=txn.transaction_id
            )

        resp_data = {
            "status": "success",
            "message": f"Successfully sent ₹{amount} to {receiver.full_name}.",
            "transaction": TransactionSerializer(txn).data,
            "wallet_balance": str(sender_wallet.balance),
        }
        if is_fraud_flagged:
            resp_data["fraud_warning"] = (
                f"Notice (Educational Simulation): {fraud_reason}"
            )

        return Response(resp_data, status=status.HTTP_200_OK)


class TransactionListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        queryset = Transaction.objects.filter(
            models.Q(sender=user) | models.Q(receiver=user)
        ).select_related('sender', 'receiver')

        # Filter by status
        status_param = request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param.upper())

        # Filter by payment method
        method_param = request.query_params.get('method')
        if method_param:
            queryset = queryset.filter(payment_method=method_param.upper())

        # Filter by direction (sent vs received)
        direction = request.query_params.get('direction')
        if direction == 'sent':
            queryset = queryset.filter(sender=user)
        elif direction == 'received':
            queryset = queryset.filter(receiver=user)

        # Search query (by transaction_id, description, or counterpart name)
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(transaction_id__icontains=search) |
                models.Q(description__icontains=search) |
                models.Q(sender__full_name__icontains=search) |
                models.Q(receiver__full_name__icontains=search)
            )

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 15))
        start = (page - 1) * page_size
        end = start + page_size

        total_count = queryset.count()
        results = queryset[start:end]

        return Response({
            "status": "success",
            "count": total_count,
            "page": page,
            "page_size": page_size,
            "results": TransactionSerializer(results, many=True).data
        })


class TransactionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, transaction_id):
        # Look up by UUID or human-readable TXN-2026-XXXX ID
        txn = Transaction.objects.filter(
            models.Q(transaction_id=transaction_id) | models.Q(id=transaction_id if len(transaction_id) == 36 else None),
            models.Q(sender=request.user) | models.Q(receiver=request.user)
        ).first()

        if not txn:
            # Admins can view any transaction
            if request.user.role == 'ADMIN':
                txn = Transaction.objects.filter(
                    models.Q(transaction_id=transaction_id) | models.Q(id=transaction_id if len(transaction_id) == 36 else None)
                ).first()

        if not txn:
            return Response({"status": "error", "message": "Transaction not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "status": "success",
            "transaction": TransactionSerializer(txn).data
        })


class CardManagementView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cards = CardToken.objects.filter(user=request.user)
        return Response({
            "status": "success",
            "cards": CardTokenSerializer(cards, many=True).data
        })

    def post(self, request):
        serializer = AddCardSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            card = serializer.save()
            return Response({
                "status": "success",
                "message": "Card securely tokenized and saved (PCI Compliant Sandbox).",
                "card": CardTokenSerializer(card).data
            }, status=status.HTTP_201_CREATED)

        return Response({
            "status": "error",
            "message": "Invalid card information.",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class DeleteCardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, card_id):
        card = CardToken.objects.filter(id=card_id, user=request.user).first()
        if not card:
            return Response({"status": "error", "message": "Card not found."}, status=status.HTTP_404_NOT_FOUND)
        card.delete()
        return Response({"status": "success", "message": "Card removed."})


class UPIManagementView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        upi_accounts = UPIAccount.objects.filter(user=request.user)
        # Create default UPI ID if none exists
        if not upi_accounts.exists():
            default_id = f"{request.user.email.split('@')[0]}@payflow"
            upi_obj, _ = UPIAccount.objects.get_or_create(
                upi_id=default_id,
                defaults={'user': request.user, 'is_primary': True}
            )
            upi_accounts = UPIAccount.objects.filter(user=request.user)

        return Response({
            "status": "success",
            "upi_accounts": UPIAccountSerializer(upi_accounts, many=True).data
        })

    def post(self, request):
        custom_handle = request.data.get('handle', '').strip().lower()
        if not custom_handle or '@' in custom_handle:
            return Response({
                "status": "error",
                "message": "Provide a valid handle (alphanumeric only, without @payflow)."
            }, status=status.HTTP_400_BAD_REQUEST)

        full_upi = f"{custom_handle}@payflow"
        if UPIAccount.objects.filter(upi_id=full_upi).exists():
            return Response({
                "status": "error",
                "message": f"UPI ID '{full_upi}' is already taken."
            }, status=status.HTTP_400_BAD_REQUEST)

        upi_obj = UPIAccount.objects.create(
            user=request.user,
            upi_id=full_upi,
            is_primary=False
        )
        return Response({
            "status": "success",
            "message": f"UPI ID '{full_upi}' created successfully.",
            "upi_account": UPIAccountSerializer(upi_obj).data
        }, status=status.HTTP_201_CREATED)


class BankAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        accounts = BankAccount.objects.filter(user=request.user)
        return Response({
            "status": "success",
            "bank_accounts": BankAccountSerializer(accounts, many=True).data
        })

    def post(self, request):
        bank_name = request.data.get('bank_name', 'HDFC Bank')
        account_number = request.data.get('account_number', '1234567890')
        ifsc = request.data.get('ifsc_code', 'HDFC0001234')

        masked = f"•••• •••• {account_number[-4:]}"
        bank = BankAccount.objects.create(
            user=request.user,
            account_holder_name=request.user.full_name,
            bank_name=bank_name,
            masked_account_number=masked,
            ifsc_code=ifsc,
            is_primary=True,
            is_verified=True
        )
        return Response({
            "status": "success",
            "message": "Bank account linked (Sandbox verified).",
            "bank_account": BankAccountSerializer(bank).data
        }, status=status.HTTP_201_CREATED)


class PaymentRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        incoming = PaymentRequest.objects.filter(payer=request.user, status='PENDING')
        outgoing = PaymentRequest.objects.filter(requester=request.user)
        return Response({
            "status": "success",
            "incoming": PaymentRequestSerializer(incoming, many=True).data,
            "outgoing": PaymentRequestSerializer(outgoing, many=True).data
        })

    def post(self, request):
        recipient_input = request.data.get('recipient', '').strip()
        amount = Decimal(str(request.data.get('amount', '0.00')))
        note = request.data.get('note', '')

        if amount <= 0:
            return Response({"status": "error", "message": "Amount must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)

        # Lookup payer
        payer = None
        if '@' in recipient_input:
            upi = UPIAccount.objects.filter(upi_id__iexact=recipient_input).first()
            payer = upi.user if upi else User.objects.filter(email__iexact=recipient_input).first()
        else:
            payer = User.objects.filter(phone_number__icontains=recipient_input).first()

        if not payer:
            return Response({"status": "error", "message": "Payer not found."}, status=status.HTTP_404_NOT_FOUND)

        if payer == request.user:
            return Response({"status": "error", "message": "Cannot request money from yourself."}, status=status.HTTP_400_BAD_REQUEST)

        req = PaymentRequest.objects.create(
            requester=request.user,
            payer=payer,
            amount=amount,
            note=note,
            expires_at=timezone.now() + datetime.timedelta(days=3)
        )

        Notification.objects.create(
            user=payer,
            title="Money Requested",
            message=f"{request.user.full_name} has requested ₹{amount}.",
            notification_type='PAYMENT_REQUEST',
            reference_id=str(req.id)
        )

        return Response({
            "status": "success",
            "message": f"Payment request of ₹{amount} sent to {payer.full_name}.",
            "request": PaymentRequestSerializer(req).data
        }, status=status.HTTP_201_CREATED)


class RespondPaymentRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, request_id):
        action = request.data.get('action')  # 'accept' or 'reject'
        req = PaymentRequest.objects.filter(id=request_id, payer=request.user, status='PENDING').first()

        if not req:
            return Response({"status": "error", "message": "Pending request not found."}, status=status.HTTP_404_NOT_FOUND)

        if action == 'reject':
            req.status = 'REJECTED'
            req.save(update_fields=['status'])
            return Response({"status": "success", "message": "Payment request rejected."})

        elif action == 'accept':
            # Execute payment from payer to requester
            payer_wallet, _ = Wallet.objects.get_or_create(user=request.user)
            requester_wallet, _ = Wallet.objects.get_or_create(user=req.requester)

            if payer_wallet.balance < req.amount:
                return Response({
                    "status": "error",
                    "message": f"Insufficient wallet balance. You have ₹{payer_wallet.balance}, required ₹{req.amount}."
                }, status=status.HTTP_400_BAD_REQUEST)

            with db_transaction.atomic():
                txn = Transaction.objects.create(
                    sender=request.user,
                    receiver=req.requester,
                    amount=req.amount,
                    currency=payer_wallet.currency,
                    payment_method='WALLET',
                    description=f"Paid Request: {req.note or 'Payment'}",
                    status='SUCCESSFUL'
                )

                payer_wallet.debit(
                    amount=req.amount,
                    reference_type='TRANSFER_SEND',
                    reference_id=txn.transaction_id,
                    description=f"Paid money request to {req.requester.full_name}"
                )

                requester_wallet.credit(
                    amount=req.amount,
                    reference_type='TRANSFER_RECEIVE',
                    reference_id=txn.transaction_id,
                    description=f"Request paid by {request.user.full_name}"
                )

                req.status = 'ACCEPTED'
                req.transaction = txn
                req.save()

                Notification.objects.create(
                    user=req.requester,
                    title="Payment Request Accepted",
                    message=f"{request.user.full_name} paid your request of ₹{req.amount}.",
                    notification_type='PAYMENT_RECEIVED',
                    reference_id=txn.transaction_id
                )

            return Response({
                "status": "success",
                "message": f"Successfully paid ₹{req.amount} to {req.requester.full_name}.",
                "transaction_id": txn.transaction_id
            })

        return Response({"status": "error", "message": "Invalid action. Use 'accept' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)


class QRVerifyView(APIView):
    """
    Parses QR code content scanned from camera or image.
    Supports standard UPI URIs: upi://pay?pa=...&pn=...&am=...
    and PayFlow merchant URLs: /pay/xyz
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        qr_data = request.data.get('qr_data', '').strip()
        if not qr_data:
            return Response({"status": "error", "message": "QR data cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        # Scenario 1: UPI URI scheme
        if qr_data.startswith('upi://pay'):
            params = {}
            for part in qr_data.replace('upi://pay?', '').split('&'):
                if '=' in part:
                    k, v = part.split('=', 1)
                    params[k] = v

            pa = params.get('pa', '')
            pn = params.get('pn', '').replace('%20', ' ')
            am = params.get('am', '')

            return Response({
                "status": "success",
                "type": "UPI",
                "recipient_name": pn or pa,
                "recipient_identifier": pa,
                "amount": am if am else None,
                "currency": params.get('cu', 'INR')
            })

        # Scenario 2: Direct UPI ID
        if '@' in qr_data and not qr_data.startswith('http'):
            user = User.objects.filter(upi_accounts__upi_id__iexact=qr_data).first()
            return Response({
                "status": "success",
                "type": "UPI",
                "recipient_name": user.full_name if user else qr_data,
                "recipient_identifier": qr_data,
                "amount": None,
                "currency": "INR"
            })

        return Response({
            "status": "success",
            "type": "PAYFLOW_LINK",
            "raw": qr_data,
            "recipient_name": "Merchant / Test QR",
            "recipient_identifier": qr_data
        })
