from rest_framework import serializers
from ..models import RetentionPolicy, Announcement


class RetentionPolicySerializer(serializers.ModelSerializer):
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = RetentionPolicy
        fields = [
            'id', 'audit_log_retention_days', 'call_log_retention_days',
            'updated_at', 'updated_by', 'updated_by_name',
        ]
        read_only_fields = ['id', 'updated_at', 'updated_by', 'updated_by_name']

    def get_updated_by_name(self, obj):
        if obj.updated_by:
            name = obj.updated_by.get_full_name()
            return name if name.strip() else obj.updated_by.username
        return None


class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    is_currently_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'description', 'announcement_type', 'visibility',
            'is_active', 'start_date', 'end_date',
            'created_by', 'created_by_name', 'is_currently_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_by_name', 'is_currently_active', 'created_at', 'updated_at']

    def get_created_by_name(self, obj):
        if obj.created_by:
            name = obj.created_by.get_full_name()
            return name if name.strip() else obj.created_by.username
        return None
