from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.core.management import call_command


def api_root(request):
    return JsonResponse({
        "platform": "PayFlow API",
        "version": "1.0.0",
        "environment": "Sandbox / Demo Mode",
        "status": "operational",
        "endpoints": {
            "auth": "/api/auth/",
            "wallet": "/api/wallet/",
            "payments": "/api/payments/",
            "merchants": "/api/merchants/",
            "notifications": "/api/notifications/",
        }
    })


def reset_demo_data_view(request):
    """Development/Demo helper endpoint to re-seed sandbox data."""
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        call_command('seed_demo_data')
        return JsonResponse({"status": "success", "message": "Demo data reset successfully."})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


urlpatterns = [
    path('', api_root, name='api_root'),
    path('api/health/', api_root, name='api_health'),
    path('api/demo/reset/', reset_demo_data_view, name='demo_reset'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/wallet/', include('wallets.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/merchants/', include('merchants.urls')),
    path('api/notifications/', include('notifications.urls')),
]
