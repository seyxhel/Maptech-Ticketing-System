from rest_framework import serializers
from .models import (
    Ticket, TicketTask, TypeOfService, TicketAttachment,
    AssignmentSession, Message, MessageReaction, MessageReadReceipt,
    EscalationLog, AuditLog, Product, Client, CallLog, CSATFeedback,
    Notification, Category,
)
from users.serializers import UserSerializer


# ────────────────────────────────────────────
# Category serializer
# ────────────────────────────────────────────

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'is_active', 'product_count', 'created_at', 'updated_at']

    def get_product_count(self, obj):
        return obj.products.count()


# ────────────────────────────────────────────
# Product serializer
# ────────────────────────────────────────────

class ProductSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source='category', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'category', 'category_detail', 'device_equipment', 'version_no', 'date_purchased',
            'serial_no', 'has_warranty', 'product_name', 'brand',
            'model_name', 'sales_no', 'is_active', 'created_at', 'updated_at',
        ]


# ────────────────────────────────────────────
# Client serializer
# ────────────────────────────────────────────

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            'id', 'client_name', 'contact_person', 'landline', 'mobile_no',
            'designation', 'department_organization', 'email_address', 'address',
            'is_active', 'created_at', 'updated_at',
        ]


# ────────────────────────────────────────────
# CallLog serializer
# ────────────────────────────────────────────

class CallLogSerializer(serializers.ModelSerializer):
    admin_name = serializers.SerializerMethodField()
    duration_seconds = serializers.ReadOnlyField()

    class Meta:
        model = CallLog
        fields = [
            'id', 'ticket', 'admin', 'admin_name', 'client_name',
            'phone_number', 'call_start', 'call_end', 'duration_seconds',
            'notes', 'created_at',
        ]
        read_only_fields = ['admin', 'admin_name', 'created_at']

    def get_admin_name(self, obj):
        if obj.admin:
            name = obj.admin.get_full_name()
            return name if name.strip() else obj.admin.username
        return ''


# ────────────────────────────────────────────
# CSAT Feedback serializer
# ────────────────────────────────────────────

class CSATFeedbackSerializer(serializers.ModelSerializer):
    admin_name = serializers.SerializerMethodField()
    employee_name = serializers.SerializerMethodField()
    stf_no = serializers.CharField(source='ticket.stf_no', read_only=True)

    class Meta:
        model = CSATFeedback
        fields = [
            'id', 'ticket', 'stf_no', 'employee', 'employee_name',
            'admin', 'admin_name', 'rating', 'comments', 'created_at',
        ]
        read_only_fields = ['admin', 'admin_name', 'employee_name', 'stf_no', 'created_at']

    def get_admin_name(self, obj):
        if obj.admin:
            name = obj.admin.get_full_name()
            return name if name.strip() else obj.admin.username
        return ''

    def get_employee_name(self, obj):
        if obj.employee:
            name = obj.employee.get_full_name()
            return name if name.strip() else obj.employee.username
        return ''





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
        fields = ['id', 'name', 'description', 'is_active', 'estimated_resolution_days']


class EscalationLogSerializer(serializers.ModelSerializer):
    from_user = UserSerializer(read_only=True)
    to_user = UserSerializer(read_only=True)

    class Meta:
        model = EscalationLog
        fields = ['id', 'ticket', 'escalation_type', 'from_user', 'to_user', 'to_external', 'notes', 'created_at']


class TicketSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    tasks = TicketTaskSerializer(many=True, read_only=True)
    attachments = TicketAttachmentSerializer(many=True, read_only=True)
    type_of_service_detail = TypeOfServiceSerializer(source='type_of_service', read_only=True)
    escalation_logs = EscalationLogSerializer(many=True, read_only=True)
    client_record_detail = ClientSerializer(source='client_record', read_only=True)
    product_record_detail = ProductSerializer(source='product_record', read_only=True)
    progress_percentage = serializers.ReadOnlyField()
    sla_estimated_days = serializers.ReadOnlyField()
    csat_feedback = CSATFeedbackSerializer(read_only=True)

    # Role-based writable fields
    TICKET_FIELDS = {
        'client', 'contact_person', 'address', 'designation',
        'landline', 'department_organization', 'mobile_no', 'email_address',
        'type_of_service', 'type_of_service_others',
        'preferred_support_type', 'description_of_problem',
        'priority', 'client_record', 'product_record',
        'estimated_resolution_days_override',
    }
    EMPLOYEE_FIELDS = {
        'has_warranty', 'product', 'brand', 'model_name',
        'device_equipment', 'version_no',
        'date_purchased', 'serial_no',
        'action_taken', 'remarks', 'job_status',
        'cascade_type', 'observation', 'signature', 'signed_by_name',
    }

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
            # New additions
            'client_record', 'client_record_detail',
            'product_record', 'product_record_detail',
            'cascade_type', 'observation',
            'signature', 'signed_by_name',
            'estimated_resolution_days_override',
            'progress_percentage', 'sla_estimated_days',
            'csat_feedback',
        ]
        read_only_fields = ['stf_no', 'date', 'time_in', 'time_out', 'confirmed_by_admin',
                            'external_escalated_to', 'external_escalation_notes', 'external_escalated_at',
                            'progress_percentage', 'sla_estimated_days']

    def _get_allowed_fields(self):
        """Return the set of writable field names based on the requesting user's role."""
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return set()
        role = request.user.role
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if role == User.ROLE_ADMIN or role == User.ROLE_SUPERADMIN:
            return self.TICKET_FIELDS
        elif role == User.ROLE_EMPLOYEE:
            return self.EMPLOYEE_FIELDS
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

class AdminCreateTicketSerializer(serializers.ModelSerializer):
    """Form shown to admins when creating a new ticket.
    Includes priority and assign_to so the admin can set them during the call flow."""
    assign_to = serializers.IntegerField(required=False, write_only=True, help_text='Employee ID to assign')
    is_existing_client = serializers.BooleanField(required=False, default=False, write_only=True,
                                                   help_text='True if using existing client record')

    class Meta:
        model = Ticket
        fields = [
            'client', 'contact_person', 'address', 'designation',
            'landline', 'department_organization', 'mobile_no', 'email_address',
            'type_of_service', 'type_of_service_others',
            'description_of_problem', 'preferred_support_type',
            'priority', 'assign_to',
            'client_record', 'product_record',
            'estimated_resolution_days_override',
            'is_existing_client',
        ]
        extra_kwargs = {
            'email_address': {'required': False, 'allow_blank': True, 'default': ''},
        }


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
    cascade_type = serializers.ChoiceField(
        required=False,
        choices=[('', '---')] + list(Ticket.CASCADE_TYPE_CHOICES),
    )
    observation = serializers.CharField(required=False, allow_blank=True, style={'base_template': 'textarea.html'})
    signature = serializers.CharField(required=False, allow_blank=True)
    signed_by_name = serializers.CharField(required=False, allow_blank=True, max_length=200)


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


# ────────────────────────────────────────────
# Knowledge Hub – proof-attachment serializer
# ────────────────────────────────────────────

class KnowledgeHubAttachmentSerializer(serializers.ModelSerializer):
    """Flat representation of a proof attachment with parent ticket context (admin view)."""
    uploaded_by = UserSerializer(read_only=True)
    published_by_detail = UserSerializer(source='published_by', read_only=True)
    ticket_id = serializers.IntegerField(source='ticket.id', read_only=True)
    stf_no = serializers.CharField(source='ticket.stf_no', read_only=True)
    ticket_status = serializers.CharField(source='ticket.status', read_only=True)
    client = serializers.CharField(source='ticket.client', read_only=True)
    description_of_problem = serializers.CharField(source='ticket.description_of_problem', read_only=True)
    type_of_service_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = TicketAttachment
        fields = [
            'id', 'file', 'uploaded_by', 'uploaded_at', 'is_resolution_proof',
            'ticket_id', 'stf_no', 'ticket_status', 'client',
            'description_of_problem', 'type_of_service_name', 'assigned_to_name',
            # Publish fields
            'is_published', 'published_title', 'published_description',
            'published_tags', 'published_by_detail', 'published_at',
            # Archive field
            'is_archived',
        ]

    def get_type_of_service_name(self, obj):
        tos = obj.ticket.type_of_service
        return tos.name if tos else obj.ticket.type_of_service_others or ''

    def get_assigned_to_name(self, obj):
        emp = obj.ticket.assigned_to
        if emp:
            name = emp.get_full_name()
            return name if name.strip() else emp.username
        return ''


class PublishedArticleSerializer(serializers.ModelSerializer):
    """Employee-facing serializer: only published knowledge hub items."""
    file_url = serializers.SerializerMethodField()
    stf_no = serializers.CharField(source='ticket.stf_no', read_only=True)
    uploaded_by_name = serializers.SerializerMethodField()
    published_by_name = serializers.SerializerMethodField()

    class Meta:
        model = TicketAttachment
        fields = [
            'id', 'published_title', 'published_description', 'published_tags',
            'file_url', 'stf_no', 'uploaded_by_name', 'published_by_name',
            'published_at', 'uploaded_at',
        ]

    def get_file_url(self, obj):
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else ''

    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            name = obj.uploaded_by.get_full_name()
            return name if name.strip() else obj.uploaded_by.username
        return ''

    def get_published_by_name(self, obj):
        if obj.published_by:
            name = obj.published_by.get_full_name()
            return name if name.strip() else obj.published_by.username
        return ''


# ────────────────────────────────────────────
# Audit Log serializer
# ────────────────────────────────────────────

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


# ────────────────────────────────────────────
# Notification serializer
# ────────────────────────────────────────────

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
