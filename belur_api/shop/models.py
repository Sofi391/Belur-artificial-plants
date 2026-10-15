from django.core.validators import RegexValidator
from django.db import models
from django.db.models import F, Q
from catalog.models import Timestamped


class ShopSettings(Timestamped):
    # SINGLETON: exactly one row (pk=1). Feeds the Visit Us page and every
    # WhatsApp / Telegram link, so the owner can change them without a deploy.
    shop_name = models.CharField(max_length=80)
    phone = models.CharField(max_length=20)
    # Digits only, international format without "+": the format wa.me needs.
    whatsapp_number = models.CharField(
        max_length=15,
        validators=[RegexValidator(r"^251\d{9}$", "Use format 251XXXXXXXXX")],
    )
    telegram_username = models.CharField(max_length=32, blank=True)  # stored WITHOUT the "@"
    address_text = models.CharField(max_length=200)
    landmark_directions = models.TextField()
    map_url = models.URLField(blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    storefront_photo = models.ImageField(upload_to="shop/", blank=True)
    hours_note = models.CharField(max_length=200, blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(condition=Q(pk=1), name="shopsettings_singleton"),
        ]


class OpeningHours(models.Model):
    settings = models.ForeignKey(ShopSettings, on_delete=models.CASCADE, related_name="hours")
    weekday = models.PositiveSmallIntegerField()   # 0 = Monday ... 6 = Sunday
    opens = models.TimeField(null=True, blank=True)
    closes = models.TimeField(null=True, blank=True)   # both null = closed that day

    class Meta:
        ordering = ["weekday"]
        constraints = [
            models.UniqueConstraint(fields=["settings", "weekday"], name="one_row_per_day"),
            models.CheckConstraint(condition=Q(weekday__lte=6), name="weekday_0_6"),
            # Closed (both null) or open with opens < closes. No overnight hours.
            models.CheckConstraint(
                condition=(
                    Q(opens__isnull=True, closes__isnull=True)
                    | Q(opens__isnull=False, closes__isnull=False, opens__lt=F("closes"))
                ),
                name="hours_both_or_neither_ordered",
            ),
        ]


class ContactMessage(Timestamped):
    # Visit Us contact form submissions. Public endpoint: throttle it.
    name = models.CharField(max_length=80)
    phone = models.CharField(max_length=20)
    message = models.TextField(max_length=1000)
    is_handled = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]