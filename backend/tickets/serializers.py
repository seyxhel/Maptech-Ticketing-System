from rest_framework import serializers
from .models import Ticket, TicketTask, Template, TypeOfService, TicketAttachment, Message, MessageReaction, MessageReadReceipt
from users.serializers import UserSerializer





class TicketTaskSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)

    class Meta:
        model = TicketTask
        fields = ['id', 'description', 'assigned_to', 'status', 'created_at']


class TicketAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)

    class Meta:
        model = TicketAttachment
        fields = ['id', 'file', 'uploaded_by', 'uploaded_at']


class TypeOfServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeOfService
        fields = ['id', 'name', 'description', 'is_active']


class TicketSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    tasks = TicketTaskSerializer(many=True, read_only=True)
    attachments = TicketAttachmentSerializer(many=True, read_only=True)
    type_of_service_detail = TypeOfServiceSerializer(source='type_of_service', read_only=True)

    # Role-based writable fields
    CLIENT_FIELDS = {
        'client', 'contact_person', 'address', 'designation',
        'landline', 'department_organization', 'mobile_no', 'email_address',
        'type_of_service', 'type_of_service_others',
    }
    EMPLOYEE_FIELDS = {
        'preferred_support_type', 'device_equipment', 'version_no',
        'date_purchased', 'serial_no', 'description_of_problem',
        'action_taken', 'remarks', 'job_status',
    }
    ADMIN_FIELDS = {'priority'}

    class Meta:
        model = Ticket
        fields = [
            'id', 'status',
            'created_by', 'assigned_to', 'tasks', 'created_at', 'updated_at',
            # New fields
            'stf_no', 'date', 'time_in', 'time_out',
            'client', 'contact_person', 'address', 'designation',
            'landline', 'department_organization', 'mobile_no', 'email_address',
            'type_of_service', 'type_of_service_detail', 'type_of_service_others',
            'priority',
            'preferred_support_type',
            'device_equipment', 'version_no', 'date_purchased', 'serial_no',
            'description_of_problem', 'action_taken', 'remarks',
            'job_status',
            'attachments',
        ]
        read_only_fields = ['stf_no', 'date', 'time_in', 'time_out']

    def _get_allowed_fields(self):
        """Return the set of writable field names based on the requesting user's role."""
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return set()
        role = request.user.role
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if role == User.ROLE_ADMIN:
            return self.ADMIN_FIELDS
        elif role == User.ROLE_EMPLOYEE:
            return self.EMPLOYEE_FIELDS
        elif role == User.ROLE_CLIENT:
            return self.CLIENT_FIELDS
        return set()

    def update(self, instance, validated_data):
        allowed = self._get_allowed_fields()
        # Strip out any fields the user's role is not allowed to write
        filtered = {k: v for k, v in validated_data.items() if k in allowed}
        return super().update(instance, filtered)

    def create(self, validated_data):
        allowed = self._get_allowed_fields()
        # Always preserve created_by (set by perform_create) — it's not role-gated
        filtered = {k: v for k, v in validated_data.items() if k in allowed or k == 'created_by'}
        return super().create(filtered)
class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = ['id', 'name', 'steps']


# ────────────────────────────────────────────
# Message serializers (used by REST endpoints)
# ────────────────────────────────────────────

class MessageReactionSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = MessageReaction
        fields = ['id', 'emoji', 'user_id', 'username', 'created_at']


class MessageReadReceiptSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = MessageReadReceipt
        fields = ['user_id', 'username', 'read_at']


class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    reactions = MessageReactionSerializer(many=True, read_only=True)
    read_by = MessageReadReceiptSerializer(source='read_receipts', many=True, read_only=True)
    reply_to_data = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'channel_type', 'sender_id', 'sender_username', 'sender_role',
            'content', 'reply_to', 'reply_to_data', 'is_system_message',
            'reactions', 'read_by', 'created_at',
        ]

    def get_reply_to_data(self, obj):
        if not obj.reply_to:
            return None
        return {
            'id': obj.reply_to.id,
            'content': obj.reply_to.content[:100],
            'sender_id': obj.reply_to.sender.id,
            'sender_username': obj.reply_to.sender.username,
        }
