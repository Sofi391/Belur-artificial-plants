from rest_framework import serializers
from .models import PlantType, Plant, Pot


class PlantTypeSerializer(serializers.ModelSerializer):
    """Nested representation for plant type in PlantSerializer."""
    
    class Meta:
        model = PlantType
        fields = ['name', 'slug']


class SuggestedPotListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for suggested pots in plant list representation."""
    
    class Meta:
        model = Pot
        fields = ['name', 'slug']


class SuggestedPotDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for suggested pots in plant detail representation."""
    
    class Meta:
        model = Pot
        fields = [
            'id',
            'name',
            'local_name',
            'slug',
            'price',
            'size_m',
            'description',
            'in_stock',
            'featured',
        ]


class PlantListSerializer(serializers.ModelSerializer):
    """Public-facing plant serializer for list API with lightweight suggested pots."""
    type = PlantTypeSerializer(read_only=True)
    suggested_pots = SuggestedPotListSerializer(read_only=True, many=True)
    
    class Meta:
        model = Plant
        fields = [
            'id',
            'name',
            'local_name',
            'slug',
            'price',
            'size_m',
            'description',
            'in_stock',
            'featured',
            'pot_included',
            'type',
            'suggested_pots',
        ]


class PlantDetailSerializer(serializers.ModelSerializer):
    """Public-facing plant serializer for detail API with detailed suggested pots."""
    type = PlantTypeSerializer(read_only=True)
    suggested_pots = SuggestedPotDetailSerializer(read_only=True, many=True)
    
    class Meta:
        model = Plant
        fields = [
            'id',
            'name',
            'local_name',
            'slug',
            'price',
            'size_m',
            'description',
            'in_stock',
            'featured',
            'pot_included',
            'type',
            'suggested_pots',
        ]


class PotSerializer(serializers.ModelSerializer):
    """Public-facing pot serializer for catalog API."""
    
    class Meta:
        model = Pot
        fields = [
            'id',
            'name',
            'local_name',
            'slug',
            'price',
            'size_m',
            'description',
            'in_stock',
            'featured',
        ]
