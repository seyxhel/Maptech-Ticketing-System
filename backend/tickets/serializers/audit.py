from rest_framework import serializers
from ..models import AuditLog, EscalationLog
from users.serializers import UserSerializer


class EscalationLogSerializer(serializers.ModelSerializer):
    from_user = UserSerializer(read_only=True)
    to_user = UserSerializer(read_only=True)

    class Meta:
        model = EscalationLog
        fields = ['id', 'ticket', 'escalation_type', 'from_user', 'to_user', 'to_external', 'notes', 'created_at']


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id', 'timestamp', 'entity', 'entity_id', 'action',
            'activity', 'actor', 'actor_email', 'actor_name',
            'ip_address', 'changes',
        ]

    def get_actor_name(self, obj):
        if obj.actor:
            name = obj.actor.get_full_name()
            return name if name.strip() else obj.actor.username
        return obj.actor_email or 'System'
