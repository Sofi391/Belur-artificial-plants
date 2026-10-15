from django.urls import path
from .views import PlantListView, PlantDetailView, PotListView, PotDetailView

app_name = 'catalog'

urlpatterns = [
    # Plants
    path('plants/', PlantListView.as_view(), name='plant-list'),
    path('plants/<slug:slug>/', PlantDetailView.as_view(), name='plant-detail'),
    
    # Pots
    path('pots/', PotListView.as_view(), name='pot-list'),
    path('pots/<slug:slug>/', PotDetailView.as_view(), name='pot-detail'),
]
