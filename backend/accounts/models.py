import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, full_name, phone_number, password=None, role='USER', **extra_fields):
        if not email:
            raise ValueError('Users must provide an email address.')
        if not phone_number:
            raise ValueError('Users must provide a phone number.')

        email = self.normalize_email(email).lower()
        user = self.model(
            email=email,
            full_name=full_name,
            phone_number=phone_number,
            role=role,
            **extra_fields
        )
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, phone_number, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        extra_fields.setdefault('is_verified', True)
        return self.create_user(email, full_name, phone_number, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('USER', 'Regular User'),
        ('MERCHANT', 'Merchant / Business'),
        ('ADMIN', 'Platform Administrator'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, max_length=255, db_index=True)
    phone_number = models.CharField(max_length=20, unique=True, db_index=True)
    full_name = models.CharField(max_length=150)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='USER')

    is_verified = models.BooleanField(default=True)
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=64, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name', 'phone_number']

    class Meta:
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.full_name} ({self.email}) - {self.role}"


class Profile(models.Model):
    KYC_STATUS_CHOICES = (
        ('VERIFIED', 'Verified'),
        ('PENDING', 'Pending Review'),
        ('NOT_SUBMITTED', 'Not Submitted'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar_url = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True, default='')
    kyc_status = models.CharField(max_length=20, choices=KYC_STATUS_CHOICES, default='VERIFIED')
    country = models.CharField(max_length=50, default='India')
    city = models.CharField(max_length=50, default='Bengaluru')
    security_score = models.IntegerField(default=85)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_security_score(self):
        score = 60
        if self.user.is_verified:
            score += 15
        if self.user.two_factor_enabled:
            score += 25
        self.security_score = min(score, 100)
        self.save(update_fields=['security_score'])
        return self.security_score

    def __str__(self):
        return f"Profile of {self.user.email}"


class LoginActivity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_activities')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    device_name = models.CharField(max_length=150, default='Chrome Browser (Windows)')
    status = models.CharField(max_length=20, default='SUCCESS')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']


class SecurityEvent(models.Model):
    EVENT_TYPES = (
        ('LOGIN', 'User Login'),
        ('PASSWORD_CHANGE', 'Password Changed'),
        ('2FA_ENABLED', '2FA Enabled'),
        ('2FA_DISABLED', '2FA Disabled'),
        ('CARD_ADDED', 'Card Tokenized & Added'),
        ('CARD_REMOVED', 'Card Removed'),
        ('PROFILE_UPDATED', 'Profile Details Updated'),
        ('DEVICE_REVOKED', 'Session/Device Revoked'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='security_events')
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    description = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
