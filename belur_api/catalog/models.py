from django.db import models
from django.db.models import Q

class Timestamped(models.Model):
    # Abstract: creates no table. Adds audit timestamps to every model that
    # inherits it. The shop and inquiries apps import it from here.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class PlantType(Timestamped):
    # Owner-managed categories (Trees, Palms, Big plants, Table pieces...).
    name = models.CharField(max_length=60, unique=True)
    slug = models.SlugField(unique=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class CatalogItem(Timestamped):
    # Abstract base shared by Plant and Pot. Not queryable on its own.
    name = models.CharField(max_length=120)
    local_name = models.CharField(max_length=120, blank=True)    # traditional name, Amharic OK
    slug = models.SlugField(max_length=140, unique=True)         # from `name` only; frozen after first publish
    price = models.DecimalField(max_digits=10, decimal_places=2)  # ETB implied
    size_m = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    description = models.TextField(blank=True)
    in_stock = models.BooleanField(default=True)
    featured = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)
    first_published_at = models.DateTimeField(null=True, blank=True, editable=False)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        abstract = True
        ordering = ["sort_order", "-created_at"]
        constraints = [
            models.CheckConstraint(condition=Q(price__gt=0), name="%(class)s_price_positive"),
            models.CheckConstraint(
                condition=Q(size_m__isnull=True) | Q(size_m__gt=0),
                name="%(class)s_size_positive",
            ),
        ]


class Plant(CatalogItem):
    type = models.ForeignKey(PlantType, on_delete=models.PROTECT, related_name="plants")
    pot_included = models.BooleanField(default=False)
    suggested_pots = models.ManyToManyField("Pot", blank=True, related_name="suggested_for")

    def __str__(self):
        return self.name

    class Meta(CatalogItem.Meta):
        indexes = [models.Index(fields=["is_published", "in_stock", "sort_order"])]


class Pot(CatalogItem):
    def __str__(self):
        return self.name

    class Meta(CatalogItem.Meta):
        indexes = [models.Index(fields=["is_published", "in_stock", "sort_order"])]


class ImageBase(Timestamped):
    # sort_order is the photo SLOT: 0 = cover, 1 and 2 = extra photos.
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        abstract = True
        ordering = ["sort_order"]


class PlantImage(ImageBase):
    plant = models.ForeignKey(Plant, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="plants/")

    class Meta(ImageBase.Meta):
        constraints = [
            # Slots 0..2 + unique per plant = max 3 photos, enforced by the DB.
            models.CheckConstraint(condition=Q(sort_order__lte=2), name="plantimage_slot_0_2"),
            # Deferred so a slot swap works inside one transaction.
            models.UniqueConstraint(
                fields=["plant", "sort_order"],
                name="plantimage_unique_slot",
                deferrable=models.Deferrable.DEFERRED,
            ),
        ]


class PotImage(ImageBase):
    pot = models.ForeignKey(Pot, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="pots/")

    class Meta(ImageBase.Meta):
        constraints = [
            models.CheckConstraint(condition=Q(sort_order__lte=2), name="potimage_slot_0_2"),
            models.UniqueConstraint(
                fields=["pot", "sort_order"],
                name="potimage_unique_slot",
                deferrable=models.Deferrable.DEFERRED,
            ),
        ]