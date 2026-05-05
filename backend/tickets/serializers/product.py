from rest_framework import serializers
from ..models import Product
from .lookup import CategorySerializer
from .client import ClientSerializer
from tickets.input_security import sanitize_payload


class ProductSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source='category', read_only=True)
    client_detail = ClientSerializer(source='client', read_only=True)

    text_field_rules = {
        'project_title': {'max_length': 300},
        'device_equipment': {'max_length': 300},
        'version_no': {'max_length': 100},
        'firmware_version': {'max_length': 120},
        'software_name': {'max_length': 300},
        'software_version': {'max_length': 120},
        'software_vendor': {'max_length': 300},
        'software_license_key': {'max_length': 300},
        'software_metadata': {'max_length': None, 'allow_newlines': True},
        'serial_no': {'max_length': 200},
        'product_name': {'max_length': 300},
        'brand': {'max_length': 300},
        'model_name': {'max_length': 300},
        'sales_no': {'max_length': 200},
        'client_purchase_no': {'max_length': 200},
        'maptech_dr': {'max_length': 200},
        'maptech_sales_invoice': {'max_length': 200},
        'maptech_sales_order_no': {'max_length': 200},
        'supplier_purchase_no': {'max_length': 200},
        'supplier_sales_invoice': {'max_length': 200},
        'supplier_delivery_receipt': {'max_length': 200},
        'others': {'max_length': None, 'allow_newlines': True},
    }

    class Meta:
        model = Product
        fields = [
            'id', 'category', 'category_detail',
            'project_title', 'client', 'client_detail',
            'device_equipment', 'version_no',
            'firmware_version', 'software_name', 'software_version', 'software_vendor', 'software_license_key', 'software_metadata',
            'serial_no', 'has_warranty', 'product_name', 'brand',
            'model_name', 'sales_no',
            'client_purchase_no', 'maptech_dr', 'maptech_sales_invoice', 'maptech_sales_order_no',
            'supplier_purchase_no', 'supplier_sales_invoice', 'supplier_delivery_receipt',
            'date_purchased', 'is_active', 'created_at', 'updated_at',
        ]

    def to_internal_value(self, data):
        return super().to_internal_value(sanitize_payload(data, self.text_field_rules))
