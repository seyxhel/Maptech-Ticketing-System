from rest_framework import serializers
from ..models import Client


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            'id', 'client_name', 'contact_person', 'landline', 'mobile_no',
            'designation', 'department_organization', 'email_address', 'address',
            'is_active', 'created_at', 'updated_at',
        ]
