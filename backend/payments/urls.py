from django.urls import path
from .views import (
    SendMoneyView,
    TransactionListView,
    TransactionDetailView,
    CardManagementView,
    DeleteCardView,
    UPIManagementView,
    BankAccountView,
    PaymentRequestView,
    RespondPaymentRequestView,
    QRVerifyView,
)

urlpatterns = [
    path('send/', SendMoneyView.as_view(), name='send_money'),
    path('transactions/', TransactionListView.as_view(), name='transactions_list'),
    path('transactions/<str:transaction_id>/', TransactionDetailView.as_view(), name='transaction_detail'),
    path('cards/', CardManagementView.as_view(), name='cards_list'),
    path('cards/<uuid:card_id>/', DeleteCardView.as_view(), name='delete_card'),
    path('upi/', UPIManagementView.as_view(), name='upi_management'),
    path('banks/', BankAccountView.as_view(), name='bank_accounts'),
    path('requests/', PaymentRequestView.as_view(), name='payment_requests'),
    path('requests/<uuid:request_id>/respond/', RespondPaymentRequestView.as_view(), name='respond_request'),
    path('qr/verify/', QRVerifyView.as_view(), name='qr_verify'),
]
