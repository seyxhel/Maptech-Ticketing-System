from rest_framework import serializers
from ..models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    ticket_stf_no = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message',
            'ticket', 'ticket_stf_no', 'is_read', 'created_at',
        ]
        read_only_fields = ['id', 'notification_type', 'title', 'message', 'ticket', 'ticket_stf_no', 'created_at']

    def get_ticket_stf_no(self, obj):
        return obj.ticket.stf_no if obj.ticket else None
