from django.contrib import admin
from .models import Plant, PlantImage, PlantType, Pot, PotImage


class PlantImageInline(admin.TabularInline):
    model = PlantImage
    fields = ["sort_order", "image"]
    ordering = ["sort_order"]
    extra = 0
    max_num = 3


class PotImageInline(admin.TabularInline):
    model = PotImage
    fields = ["sort_order", "image"]
    ordering = ["sort_order"]
    extra = 0
    max_num = 3


@admin.register(PlantType)
class PlantTypeAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "sort_order"]
    search_fields = ["name"]
    list_editable = ["sort_order"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Plant)
class PlantAdmin(admin.ModelAdmin):
    list_display = ["name", "type", "price", "in_stock", "featured", "is_published", "sort_order"]
    list_filter = ["type", "in_stock", "featured", "is_published"]
    search_fields = ["name", "local_name"]
    list_editable = ["price", "in_stock", "featured", "is_published", "sort_order"]
    prepopulated_fields = {"slug": ("name",)}
    filter_horizontal = ["suggested_pots"]
    inlines = [PlantImageInline]


@admin.register(Pot)
class PotAdmin(admin.ModelAdmin):
    list_display = ["name", "price", "in_stock", "featured", "is_published", "sort_order"]
    list_filter = ["in_stock", "featured", "is_published"]
    search_fields = ["name", "local_name"]
    list_editable = ["price", "in_stock", "featured", "is_published", "sort_order"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [PotImageInline]
