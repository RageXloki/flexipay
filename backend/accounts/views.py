from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import models
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from django.utils import timezone
from .models import User, Profile, LoginActivity, SecurityEvent
from .serializers import (
    UserSerializer,
    ProfileSerializer,
    RegisterSerializer,
    LoginSerializer,
    ChangePasswordSerializer,
    LoginActivitySerializer,
    SecurityEventSerializer,
)
from wallets.models import Wallet


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '127.0.0.1')


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Automatically initialize user wallet
            Wallet.objects.get_or_create(user=user, defaults={'balance': 0.00})

            # Record security event
            SecurityEvent.objects.create(
                user=user,
                event_type='PROFILE_UPDATED',
                description='Account registered and verified',
                ip_address=get_client_ip(request)
            )

            # Issue JWT
            refresh = RefreshToken.for_user(user)
            return Response({
                "status": "success",
                "message": "Registration successful.",
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
                "user": UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)

        return Response({
            "status": "error",
            "message": "Registration failed. Please check form errors.",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']

            # If 2FA enabled and no OTP provided
            if user.two_factor_enabled:
                otp = request.data.get('otp', '').strip()
                # Realistic sandbox OTP: any 6 digit code or test '123456'
                if not otp or len(otp) != 6:
                    return Response({
                        "status": "requires_2fa",
                        "message": "Two-factor authentication required. Use simulated code 123456.",
                        "email": user.email
                    }, status=status.HTTP_200_OK)

            # Record login activity
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:400]
            LoginActivity.objects.create(
                user=user,
                ip_address=get_client_ip(request),
                user_agent=user_agent,
                device_name="Browser Session",
                status='SUCCESS'
            )

            # Make sure wallet exists
            Wallet.objects.get_or_create(user=user, defaults={'balance': 0.00})

            refresh = RefreshToken.for_user(user)
            return Response({
                "status": "success",
                "message": f"Welcome back, {user.full_name}!",
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)

        return Response({
            "status": "error",
            "message": "Invalid login credentials.",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass  # Even if token is already expired or blacklisting is disabled, proceed

        return Response({"status": "success", "message": "Successfully logged out."})


class CurrentUserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        profile.calculate_security_score()
        return Response({
            "status": "success",
            "user": UserSerializer(request.user).data,
            "profile": ProfileSerializer(profile).data
        })

    def patch(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)

        user_data = {}
        if 'full_name' in request.data:
            user_data['full_name'] = request.data['full_name']

        if user_data:
            user_serializer = UserSerializer(request.user, data=user_data, partial=True)
            if user_serializer.is_valid():
                user_serializer.save()

        profile_serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if profile_serializer.is_valid():
            profile_serializer.save()
            profile.calculate_security_score()
            return Response({
                "status": "success",
                "message": "Profile updated successfully.",
                "profile": ProfileSerializer(profile).data
            })

        return Response({
            "status": "error",
            "message": "Invalid profile data.",
            "errors": profile_serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            if not request.user.check_password(serializer.validated_data['old_password']):
                return Response({
                    "status": "error",
                    "message": "Incorrect existing password."
                }, status=status.HTTP_400_BAD_REQUEST)

            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()

            SecurityEvent.objects.create(
                user=request.user,
                event_type='PASSWORD_CHANGE',
                description='Account password changed securely',
                ip_address=get_client_ip(request)
            )

            return Response({
                "status": "success",
                "message": "Password changed successfully. Please keep your credentials secure."
            })

        return Response({
            "status": "error",
            "message": "Password change failed.",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class Toggle2FAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        enable = request.data.get('enable', not user.two_factor_enabled)
        user.two_factor_enabled = enable
        user.save(update_fields=['two_factor_enabled'])

        profile, _ = Profile.objects.get_or_create(user=user)
        profile.calculate_security_score()

        event_type = '2FA_ENABLED' if enable else '2FA_DISABLED'
        SecurityEvent.objects.create(
            user=user,
            event_type=event_type,
            description=f"Two-Factor Authentication {'enabled' if enable else 'disabled'}",
            ip_address=get_client_ip(request)
        )

        return Response({
            "status": "success",
            "two_factor_enabled": user.two_factor_enabled,
            "security_score": profile.security_score,
            "message": f"Two-Factor Authentication {'enabled' if enable else 'disabled'}."
        })


class SecurityCenterView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        score = profile.calculate_security_score()

        login_history = LoginActivity.objects.filter(user=request.user)[:10]
        security_events = SecurityEvent.objects.filter(user=request.user)[:10]

        return Response({
            "status": "success",
            "security_score": score,
            "two_factor_enabled": request.user.two_factor_enabled,
            "is_verified": request.user.is_verified,
            "login_activities": LoginActivitySerializer(login_history, many=True).data,
            "security_events": SecurityEventSerializer(security_events, many=True).data,
        })


class UserLookupView(APIView):
    """
    Search users or merchants by email, phone, or UPI ID
    for seamless Send Money flow.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query or len(query) < 2:
            return Response({"status": "success", "results": []})

        users = User.objects.filter(
            models.Q(email__icontains=query) |
            models.Q(phone_number__icontains=query) |
            models.Q(full_name__icontains=query) |
            models.Q(upi_accounts__upi_id__icontains=query)
        ).distinct()[:8]

        results = []
        for u in users:
            # Mask phone number for privacy: +91 ••••• ••123
            masked_phone = u.phone_number
            if len(masked_phone) >= 7:
                masked_phone = f"{masked_phone[:3]} ••••• {masked_phone[-3:]}"

            upi = u.upi_accounts.first()
            results.append({
                "id": str(u.id),
                "full_name": u.full_name,
                "email": u.email,
                "phone_number": masked_phone,
                "upi_id": upi.upi_id if upi else f"{u.email.split('@')[0]}@payflow",
                "role": u.role,
            })

        return Response({"status": "success", "results": results})


class ForgotPasswordSimulationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        # In sandbox mode, accept any valid email
        return Response({
            "status": "success",
            "message": f"Password reset instructions have been simulated for {email}. Use token 'SANDBOX-RESET-2026' to complete reset.",
            "reset_token": "SANDBOX-RESET-2026"
        })


class ResetPasswordSimulationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        if not new_password or len(new_password) < 8:
            return Response({
                "status": "error",
                "message": "Password must be at least 8 characters long."
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "status": "success",
            "message": "Password has been successfully updated. You may now log in."
        })
