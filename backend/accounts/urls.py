from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    CurrentUserProfileView,
    ChangePasswordView,
    Toggle2FAView,
    SecurityCenterView,
    UserLookupView,
    ForgotPasswordSimulationView,
    ResetPasswordSimulationView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', CurrentUserProfileView.as_view(), name='current_user'),
    path('profile/', CurrentUserProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('toggle-2fa/', Toggle2FAView.as_view(), name='toggle_2fa'),
    path('security/', SecurityCenterView.as_view(), name='security_center'),
    path('users/search/', UserLookupView.as_view(), name='user_search'),
    path('forgot-password/', ForgotPasswordSimulationView.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordSimulationView.as_view(), name='reset_password'),
]
