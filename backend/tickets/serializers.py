from rest_framework import serializers
from .models import Ticket, TicketTask, TypeOfService, TicketAttachment, AssignmentSession, Message, MessageReaction, MessageReadReceipt, CSATSurvey, EscalationLog
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
        fields = ['id', 'file', 'uploaded_by', 'uploaded_at', 'is_resolution_proof']


class TypeOfServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeOfService
        fields = ['id', 'name', 'description', 'is_active']


class EscalationLogSerializer(serializers.ModelSerializer):
    from_user = UserSerializer(read_only=True)
    to_user = UserSerializer(read_only=True)

    class Meta:
        model = EscalationLog
        fields = ['id', 'escalation_type', 'from_user', 'to_user', 'to_external', 'notes', 'created_at']


class CSATSurveySerializer(serializers.ModelSerializer):
    class Meta:
        model = CSATSurvey
        fields = ['id', 'ticket', 'rating', 'comments', 'has_other_concerns', 'other_concerns_text', 'created_at']
        read_only_fields = ['id', 'created_at']


class TicketSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    tasks = TicketTaskSerializer(many=True, read_only=True)
    attachments = TicketAttachmentSerializer(many=True, read_only=True)
    type_of_service_detail = TypeOfServiceSerializer(source='type_of_service', read_only=True)
    escalation_logs = EscalationLogSerializer(many=True, read_only=True)
    csat_survey = CSATSurveySerializer(read_only=True)

    # Role-based writable fields
    CLIENT_FIELDS = {
        'client', 'contact_person', 'address', 'designation',
        'landline', 'department_organization', 'mobile_no', 'email_address',
        'type_of_service', 'type_of_service_others',
        'preferred_support_type', 'description_of_problem',
    }
    EMPLOYEE_FIELDS = {
        'has_warranty', 'product', 'brand', 'model_name',
        'device_equipment', 'version_no',
        'date_purchased', 'serial_no',
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
            'priority', 'confirmed_by_admin',
            'preferred_support_type', 'description_of_problem',
            'has_warranty', 'product', 'brand', 'model_name',
            'device_equipment', 'version_no', 'date_purchased', 'serial_no',
            'action_taken', 'remarks',
            'job_status',
            'external_escalated_to', 'external_escalation_notes', 'external_escalated_at',
            'attachments',
            'escalation_logs',
            'csat_survey',
        ]
        read_only_fields = ['stf_no', 'date', 'time_in', 'time_out', 'confirmed_by_admin',
                            'external_escalated_to', 'external_escalation_notes', 'external_escalated_at']

    def _get_allowed_fields(self):
        """Return the set of writable field names based on the requesting user's role."""
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return set()
        role = request.user.role
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if role == User.ROLE_ADMIN or role == User.ROLE_SUPERADMIN:
            return self.ADMIN_FIELDS | self.CLIENT_FIELDS
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
        # Always allow `created_by` to pass through (set by the view),
        # even if it's not in the role-writable fields.
        filtered = {k: v for k, v in validated_data.items() if k in allowed or k == 'created_by'}
        return super().create(filtered)


# ────────────────────────────────────────────
# Role-specific form serializers (DRF browsable API)
# ────────────────────────────────────────────

class ClientCreateTicketSerializer(serializers.ModelSerializer):
    """Form shown to clients when creating a new ticket."""
    class Meta:
        model = Ticket
        fields = [
            'client', 'contact_person', 'address', 'designation',
            'landline', 'department_organization', 'mobile_no', 'email_address',
            'type_of_service', 'type_of_service_others',
            'description_of_problem', 'preferred_support_type',
        ]


class AdminTicketActionSerializer(serializers.Serializer):
    """Form shown to admins: pick a ticket, set priority & assign agent."""
    ticket = serializers.IntegerField(help_text='Ticket ID')
    priority = serializers.ChoiceField(
        choices=[('', '---')] + list(Ticket.PRIORITY_CHOICES),
        required=False,
    )
    assign_agent = serializers.IntegerField(
        required=False,
        help_text='Employee user ID to assign',
    )


class EmployeeTicketActionSerializer(serializers.Serializer):
    """Form shown to employees: pick a ticket, fill in product/service fields."""
    ticket = serializers.IntegerField(help_text='Ticket ID')
    has_warranty = serializers.BooleanField(required=False, default=False)
    product = serializers.CharField(required=False, allow_blank=True, max_length=300)
    brand = serializers.CharField(required=False, allow_blank=True, max_length=300)
    model_name = serializers.CharField(required=False, allow_blank=True, max_length=300)
    device_equipment = serializers.CharField(required=False, allow_blank=True, max_length=300)
    version_no = serializers.CharField(required=False, allow_blank=True, max_length=100)
    date_purchased = serializers.DateField(required=False, allow_null=True)
    serial_no = serializers.CharField(required=False, allow_blank=True, max_length=200)
    action_taken = serializers.CharField(required=False, allow_blank=True, style={'base_template': 'textarea.html'})
    remarks = serializers.CharField(required=False, allow_blank=True, style={'base_template': 'textarea.html'})
    job_status = serializers.ChoiceField(
        required=False,
        choices=[('', '---')] + list(Ticket.JOB_STATUS_CHOICES),
    )


# ────────────────────────────────────────────
# Message serializers (used by REST endpoints)
# ────────────────────────────────────────────

class AssignmentSessionSerializer(serializers.ModelSerializer):
    employee = UserSerializer(read_only=True)

    class Meta:
        model = AssignmentSession
        fields = ['id', 'employee', 'started_at', 'ended_at', 'is_active']


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
