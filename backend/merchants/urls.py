from django.urls import path
from .views import (
    MerchantProfileView,
    MerchantDashboardView,
    PaymentLinkListCreateView,
    PublicPaymentLinkDetailView,
    PublicPaymentLinkProcessView,
    RefundCreateView,
)

urlpatterns = [
    path('profile/', MerchantProfileView.as_view(), name='merchant_profile'),
    path('dashboard/', MerchantDashboardView.as_view(), name='merchant_dashboard'),
    path('payment-links/', PaymentLinkListCreateView.as_view(), name='merchant_links'),
    path('pay-link/<str:link_code>/', PublicPaymentLinkDetailView.as_view(), name='public_pay_link'),
    path('pay-link/<str:link_code>/process/', PublicPaymentLinkProcessView.as_view(), name='public_pay_process'),
    path('refunds/', RefundCreateView.as_view(), name='refund_create'),
]
