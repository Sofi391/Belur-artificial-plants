from django.db.models import Prefetch
from django_filters import FilterSet, CharFilter, NumberFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics
from rest_framework.permissions import AllowAny
from .models import Plant, Pot
from .serializers import (
    PlantListSerializer,
    PlantDetailSerializer,
    PotSerializer,
)


def get_published_plants_queryset():
    """Return optimized queryset for published plants with prefetched suggested pots."""
    published_pots = Pot.objects.filter(is_published=True)
    return Plant.objects.filter(is_published=True).select_related('type').prefetch_related(
        Prefetch('suggested_pots', queryset=published_pots)
    )


class PlantFilterSet(FilterSet):
    """Custom filterset for plants with clean public API parameters."""
    type = CharFilter(field_name='type__slug')
    min_price = NumberFilter(field_name='price', lookup_expr='gte')
    max_price = NumberFilter(field_name='price', lookup_expr='lte')

    class Meta:
        model = Plant
        fields = ['in_stock', 'featured']


class PotFilterSet(FilterSet):
    """Custom filterset for pots with price range filtering."""
    min_price = NumberFilter(field_name='price', lookup_expr='gte')
    max_price = NumberFilter(field_name='price', lookup_expr='lte')

    class Meta:
        model = Pot
        fields = ['in_stock', 'featured']


class PlantListView(generics.ListAPIView):
    """Public API: List all published plants with filtering and search."""
    permission_classes = [AllowAny]
    serializer_class = PlantListSerializer
    queryset = get_published_plants_queryset()
    filterset_class = PlantFilterSet
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'local_name', 'description']
    ordering_fields = ['name', 'price', 'created_at']
    ordering = ['sort_order', '-created_at']


class PlantDetailView(generics.RetrieveAPIView):
    """Public API: Retrieve a single published plant by slug."""
    permission_classes = [AllowAny]
    serializer_class = PlantDetailSerializer
    queryset = get_published_plants_queryset()
    lookup_field = 'slug'


class PotListView(generics.ListAPIView):
    """Public API: List all published pots with filtering and search."""
    permission_classes = [AllowAny]
    serializer_class = PotSerializer
    queryset = Pot.objects.filter(is_published=True)
    filterset_class = PotFilterSet
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'local_name', 'description']
    ordering_fields = ['name', 'price', 'created_at']
    ordering = ['sort_order', '-created_at']


class PotDetailView(generics.RetrieveAPIView):
    """Public API: Retrieve a single published pot by slug."""
    permission_classes = [AllowAny]
    serializer_class = PotSerializer
    queryset = Pot.objects.filter(is_published=True)
    lookup_field = 'slug'
