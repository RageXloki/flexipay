import re
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, Profile, LoginActivity, SecurityEvent


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'phone_number', 'full_name',
            'role', 'is_verified', 'two_factor_enabled',
            'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Profile
        fields = [
            'id', 'user', 'avatar_url', 'bio', 'kyc_status',
            'country', 'city', 'security_score', 'updated_at'
        ]
        read_only_fields = ['id', 'security_score', 'updated_at']


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone_number = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=['USER', 'MERCHANT'], default='USER')

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return value.lower()

    def validate_phone_number(self, value):
        clean_phone = re.sub(r'[\s\-\(\)]', '', value)
        if User.objects.filter(phone_number=clean_phone).exists():
            raise serializers.ValidationError("An account with this phone number already exists.")
        return clean_phone

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        # Validate password strength using Django's password validators
        validate_password(data['password'])
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        Profile.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(help_text="Email or Phone Number")
    password = serializers.CharField(write_only=True)
    otp = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        identifier = data.get('identifier', '').strip()
        password = data.get('password')

        if not identifier or not password:
            raise serializers.ValidationError("Both identifier and password are required.")

        # Find user by email or phone
        user = None
        if '@' in identifier:
            user = User.objects.filter(email__iexact=identifier).first()
            if not user and '@payflow.local' in identifier:
                alt_email = identifier.replace('@payflow.local', '@flexipay.local')
                user = User.objects.filter(email__iexact=alt_email).first()
            elif not user and '@flexipay.local' in identifier:
                alt_email = identifier.replace('@flexipay.local', '@payflow.local')
                user = User.objects.filter(email__iexact=alt_email).first()
        else:
            clean_phone = re.sub(r'[\s\-\(\)]', '', identifier)
            user = User.objects.filter(phone_number=clean_phone).first()

        if not user or not user.check_password(password):
            raise serializers.ValidationError("Invalid credentials. Please verify your email/phone and password.")

        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated or suspended.")

        data['user'] = user
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_new_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_new_password']:
            raise serializers.ValidationError({"confirm_new_password": "New passwords do not match."})
        validate_password(data['new_password'])
        return data


class LoginActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginActivity
        fields = ['id', 'ip_address', 'device_name', 'status', 'timestamp']


class SecurityEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecurityEvent
        fields = ['id', 'event_type', 'description', 'ip_address', 'created_at']
