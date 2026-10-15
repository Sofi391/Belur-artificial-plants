from django.db import models
from django.db.models import Q
from catalog.models import Timestamped


class Inquiry(Timestamped):
    # One record per "Send via WhatsApp/Telegram" press, logged before the chat
    # opens. Anonymous: no customer identity stored. Totals are recomputed
    # server-side from current prices.
    CHANNEL_CHOICES = [("whatsapp", "WhatsApp"), ("telegram", "Telegram")]
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    item_count = models.PositiveSmallIntegerField()
    is_handled = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]


class InquiryItem(models.Model):
    KIND_CHOICES = [("plant", "Plant"), ("pot", "Pot")]
    inquiry = models.ForeignKey(Inquiry, on_delete=models.CASCADE, related_name="items")
    kind = models.CharField(max_length=5, choices=KIND_CHOICES)

    # String references ("app.Model") so this app never imports catalog.models.
    # SET_NULL: deleting a product never deletes inquiry history.
    plant = models.ForeignKey("catalog.Plant", null=True, blank=True, on_delete=models.SET_NULL)
    pot = models.ForeignKey("catalog.Pot", null=True, blank=True, on_delete=models.SET_NULL)

    # Snapshot of what the customer saw: survives price changes and deletions.
    name = models.CharField(max_length=120)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveSmallIntegerField()

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(quantity__gte=1, quantity__lte=99), name="inqitem_qty_range"
            ),
            # "Not both", deliberately not "exactly one": SET_NULL on delete
            # would otherwise violate it.
            models.CheckConstraint(
                condition=~(Q(plant__isnull=False) & Q(pot__isnull=False)),
                name="inqitem_not_both",
            ),
        ]