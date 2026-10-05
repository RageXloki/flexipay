"""
Custom DRF exception handler to ensure all error responses follow a uniform,
secure format and never leak database internals or raw stack traces.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first to get standard response
    response = exception_handler(exc, context)

    if response is not None:
        error_message = "An error occurred while processing your request."
        errors = response.data

        if isinstance(response.data, dict):
            if 'detail' in response.data:
                error_message = str(response.data['detail'])
            else:
                first_key = next(iter(response.data))
                val = response.data[first_key]
                if isinstance(val, list) and len(val) > 0:
                    error_message = f"{first_key.replace('_', ' ').capitalize()}: {val[0]}"
                else:
                    error_message = f"{first_key.replace('_', ' ').capitalize()}: {val}"
        elif isinstance(response.data, list) and len(response.data) > 0:
            error_message = str(response.data[0])

        response.data = {
            "status": "error",
            "message": error_message,
            "errors": errors,
            "code": getattr(exc, 'default_code', 'error'),
        }
        return response

    # Unhandled server errors (500)
    logger.error(f"Unhandled exception in API: {str(exc)}", exc_info=True)
    return Response(
        {
            "status": "error",
            "message": "A server error occurred. Our team has been notified. Please try again later.",
            "code": "server_error"
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
