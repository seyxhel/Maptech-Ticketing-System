from rest_framework import serializers
from ..models import Product
from .lookup import CategorySerializer


class ProductSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source='category', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'category', 'category_detail', 'device_equipment', 'version_no', 'date_purchased',
            'serial_no', 'has_warranty', 'product_name', 'brand',
            'model_name', 'sales_no', 'others', 'is_active', 'created_at', 'updated_at',
        ]
