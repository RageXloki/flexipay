from django.urls import path
from .views import (
    WalletDetailView,
    WalletLedgerTransactionsView,
    AddMoneyView,
    WithdrawMoneyView,
)

urlpatterns = [
    path('', WalletDetailView.as_view(), name='wallet_detail'),
    path('transactions/', WalletLedgerTransactionsView.as_view(), name='wallet_transactions'),
    path('add-money/', AddMoneyView.as_view(), name='add_money'),
    path('withdraw/', WithdrawMoneyView.as_view(), name='withdraw_money'),
]
