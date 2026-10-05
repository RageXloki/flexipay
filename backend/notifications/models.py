import uuid
from django.db import models
from django.conf import settings


class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('PAYMENT_RECEIVED', 'Payment Received'),
        ('PAYMENT_SENT', 'Payment Sent'),
        ('PAYMENT_REQUEST', 'Payment Request'),
        ('REFUND', 'Refund Update'),
        ('SECURITY_ALERT', 'Security Alert'),
        ('SYSTEM', 'System Announcement'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES, default='SYSTEM')
    is_read = models.BooleanField(default=False, db_index=True)
    reference_id = models.CharField(max_length=100, blank=True)
    data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.title} ({'Read' if self.is_read else 'Unread'})"
