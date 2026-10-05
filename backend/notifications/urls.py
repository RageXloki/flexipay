from django.urls import path
from .views import (
    NotificationListView,
    MarkNotificationReadView,
    AdminDashboardView,
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification_list'),
    path('mark-read/', MarkNotificationReadView.as_view(), name='mark_all_read'),
    path('mark-read/<uuid:notification_id>/', MarkNotificationReadView.as_view(), name='mark_one_read'),
    path('admin/overview/', AdminDashboardView.as_view(), name='admin_overview'),
    path('admin/users/action/', AdminDashboardView.as_view(), name='admin_user_action'),
]
