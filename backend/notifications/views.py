from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import models
from .models import Notification
from .serializers import NotificationSerializer
from accounts.models import User
from merchants.models import Merchant
from payments.models import Transaction


class NotificationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = Notification.objects.filter(user=request.user)
        unread_count = queryset.filter(is_read=False).count()
        notifications = queryset[:30]

        return Response({
            "status": "success",
            "unread_count": unread_count,
            "results": NotificationSerializer(notifications, many=True).data
        })


class MarkNotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, notification_id=None):
        if notification_id:
            notif = Notification.objects.filter(id=notification_id, user=request.user).first()
            if notif:
                notif.is_read = True
                notif.save(update_fields=['is_read'])
        else:
            # Mark all as read
            Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)

        return Response({"status": "success", "message": "Notifications updated."})


class AdminDashboardView(APIView):
    """
    Platform Administrator Management & Analytics.
    Accessible only to users with role='ADMIN'.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({"status": "error", "message": "Administrator privileges required."}, status=status.HTTP_403_FORBIDDEN)

        total_users = User.objects.filter(role='USER').count()
        total_merchants = User.objects.filter(role='MERCHANT').count()
        all_txns = Transaction.objects.all()

        total_volume = all_txns.filter(status='SUCCESSFUL').aggregate(total=models.Sum('amount'))['total'] or 0
        total_transactions_count = all_txns.count()
        failed_count = all_txns.filter(status='FAILED').count()
        fraud_flagged_count = all_txns.filter(is_flagged_fraud=True).count()

        recent_users = User.objects.all().order_by('-date_joined')[:10]
        recent_txns = all_txns.order_by('-created_at')[:10]
        flagged_txns = all_txns.filter(is_flagged_fraud=True).order_by('-created_at')[:10]

        users_list = []
        for u in recent_users:
            users_list.append({
                "id": str(u.id),
                "full_name": u.full_name,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "is_verified": u.is_verified,
                "date_joined": u.date_joined
            })

        from payments.serializers import TransactionSerializer

        return Response({
            "status": "success",
            "metrics": {
                "total_users": total_users,
                "total_merchants": total_merchants,
                "total_volume": str(total_volume),
                "total_transactions": total_transactions_count,
                "failed_transactions": failed_count,
                "fraud_flagged_count": fraud_flagged_count,
            },
            "users": users_list,
            "recent_transactions": TransactionSerializer(recent_txns, many=True).data,
            "flagged_transactions": TransactionSerializer(flagged_txns, many=True).data
        })

    def patch(self, request):
        """Toggle user activation/suspension status."""
        if request.user.role != 'ADMIN':
            return Response({"status": "error", "message": "Administrator privileges required."}, status=status.HTTP_403_FORBIDDEN)

        target_user_id = request.data.get('user_id')
        action = request.data.get('action')  # 'suspend' or 'activate'

        target = User.objects.filter(id=target_user_id).first()
        if not target:
            return Response({"status": "error", "message": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if action == 'suspend':
            target.is_active = False
            target.save(update_fields=['is_active'])
            return Response({"status": "success", "message": f"User {target.email} has been suspended."})
        elif action == 'activate':
            target.is_active = True
            target.save(update_fields=['is_active'])
            return Response({"status": "success", "message": f"User {target.email} has been activated."})

        return Response({"status": "error", "message": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)
