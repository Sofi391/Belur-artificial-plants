from django.http import JsonResponse
from .models import ShopSettings


def health(request):
    try:
        ShopSettings.objects.values("pk").first()
        return JsonResponse({"status": "ok"})
    except Exception as e:
        return JsonResponse({"status": "error", "detail": str(e)}, status=503)
