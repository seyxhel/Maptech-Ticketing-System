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

    class Meta:
        model = Ticket
        fields = [
            'id', 'description', 'status',
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
