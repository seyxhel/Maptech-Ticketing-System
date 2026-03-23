from rest_framework import serializers
from ..models import (
    Ticket, TicketTask, TicketAttachment, EscalationLog, AuditLog,
)
from users.serializers import UserSerializer
from .lookup import TypeOfServiceSerializer
from .client import ClientSerializer
from .product import ProductSerializer
from .support import CSATFeedbackSerializer
from .audit import EscalationLogSerializer


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
    linked_ticket_ids = serializers.PrimaryKeyRelatedField(
        source='linked_tickets', many=True, read_only=True,
    )
    linked_ticket_stfs = serializers.SerializerMethodField()
    was_for_observation = serializers.SerializerMethodField()

    # ── Client fields: read-only virtual fields from client_record FK ──
    client = serializers.SerializerMethodField()
    contact_person = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    designation = serializers.SerializerMethodField()
    landline = serializers.SerializerMethodField()
    department_organization = serializers.SerializerMethodField()
    mobile_no = serializers.SerializerMethodField()
    email_address = serializers.SerializerMethodField()

    def get_client(self, obj):
        return obj.client_record.client_name if obj.client_record else ''

    def get_contact_person(self, obj):
        return obj.client_record.contact_person if obj.client_record else ''

    def get_address(self, obj):
        return obj.client_record.address if obj.client_record else ''

    def get_designation(self, obj):
        return obj.client_record.designation if obj.client_record else ''

    def get_landline(self, obj):
        return obj.client_record.landline if obj.client_record else ''

    def get_department_organization(self, obj):
        return obj.client_record.department_organization if obj.client_record else ''

    def get_mobile_no(self, obj):
        return obj.client_record.mobile_no if obj.client_record else ''

    def get_email_address(self, obj):
        return obj.client_record.email_address if obj.client_record else ''

    # ── Product fields: read-only views of linked `product_record` (Product)
    product = serializers.SerializerMethodField()
    brand = serializers.SerializerMethodField()
    model_name = serializers.SerializerMethodField()
    device_equipment = serializers.SerializerMethodField()
    version_no = serializers.SerializerMethodField()
    date_purchased = serializers.SerializerMethodField()
    serial_no = serializers.SerializerMethodField()
    sales_no = serializers.SerializerMethodField()
    others = serializers.SerializerMethodField()

    # Role-based writable fields
    TICKET_FIELDS = {
        'type_of_service', 'type_of_service_others',
        'preferred_support_type', 'description_of_problem',
        'priority', 'client_record', 'product_record',
        'estimated_resolution_days_override',
    }
    PRODUCT_FIELDS = {
        'product_name', 'brand', 'model_name', 'device_equipment',
        'version_no', 'date_purchased', 'serial_no', 'sales_no',
        'has_warranty', 'others',
    }
    EMPLOYEE_FIELDS = {
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
            # Client info – read-only, served via client_record
            'client', 'contact_person', 'address', 'designation',
            'landline', 'department_organization', 'mobile_no', 'email_address',
            'type_of_service', 'type_of_service_detail', 'type_of_service_others',
            'priority', 'confirmed_by_admin',
            'preferred_support_type', 'description_of_problem',
            'product', 'brand', 'model_name',
            'device_equipment', 'version_no', 'date_purchased', 'serial_no', 'sales_no', 'others',
            'action_taken', 'remarks',
            'job_status',
            'external_escalated_to', 'external_escalation_notes', 'external_escalated_at',
            'attachments',
            'escalation_logs',
            # FK references
            'client_record', 'client_record_detail',
            'product_record', 'product_record_detail',
            'cascade_type', 'observation',
            'signature', 'signed_by_name',
            'estimated_resolution_days_override',
            'progress_percentage', 'sla_estimated_days',
            'csat_feedback',
            'linked_ticket_ids', 'linked_ticket_stfs',
            'was_for_observation',
        ]
        read_only_fields = ['stf_no', 'date', 'time_in', 'time_out', 'confirmed_by_admin',
                            'external_escalated_to', 'external_escalation_notes', 'external_escalated_at',
                            'progress_percentage', 'sla_estimated_days']

    def get_linked_ticket_stfs(self, obj):
        return list(obj.linked_tickets.values_list('stf_no', flat=True))

    # Product field accessors (read from linked `product_record`)
    def _product_field(self, obj, field_name):
        pr = getattr(obj, 'product_record', None)
        if not pr:
            return ''
        val = getattr(pr, field_name, None)
        if val is None:
            return ''
        return val

    def get_product(self, obj):
        return self._product_field(obj, 'product_name')

    def get_brand(self, obj):
        return self._product_field(obj, 'brand')

    def get_model_name(self, obj):
        return self._product_field(obj, 'model_name')

    def get_device_equipment(self, obj):
        return self._product_field(obj, 'device_equipment')

    def get_version_no(self, obj):
        return self._product_field(obj, 'version_no')

    def get_date_purchased(self, obj):
        return self._product_field(obj, 'date_purchased')

    def get_serial_no(self, obj):
        return self._product_field(obj, 'serial_no')

    def get_sales_no(self, obj):
        return self._product_field(obj, 'sales_no')

    def get_others(self, obj):
        return self._product_field(obj, 'others')

    def get_was_for_observation(self, obj):
        if obj.status == Ticket.STATUS_FOR_OBSERVATION:
            return True
        if obj.observation:
            return True
        return AuditLog.objects.filter(
            entity=AuditLog.ENTITY_TICKET, entity_id=str(obj.id), action=AuditLog.ACTION_OBSERVE
        ).exists()

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


class AdminCreateTicketSerializer(serializers.ModelSerializer):
    """Form shown to admins when creating a new ticket.
    Includes priority and assign_to so the admin can set them during the call flow."""
    assign_to = serializers.IntegerField(required=False, write_only=True, help_text='Employee ID to assign')
    is_existing_client = serializers.BooleanField(required=False, default=False, write_only=True,
                                                   help_text='True if using existing client record')
    # Write-only client fields – used to auto-create a Client record when is_existing_client=False
    client = serializers.CharField(required=False, allow_blank=True, write_only=True)
    contact_person = serializers.CharField(required=False, allow_blank=True, write_only=True)
    address = serializers.CharField(required=False, allow_blank=True, write_only=True)
    designation = serializers.CharField(required=False, allow_blank=True, write_only=True)
    landline = serializers.CharField(required=False, allow_blank=True, write_only=True)
    department_organization = serializers.CharField(required=False, allow_blank=True, write_only=True)
    mobile_no = serializers.CharField(required=False, allow_blank=True, write_only=True)
    email_address = serializers.EmailField(required=False, allow_blank=True, write_only=True)
    # Write-only product fields – used to auto-create a Product record
    has_warranty = serializers.BooleanField(required=False, default=False, write_only=True)
    product = serializers.CharField(required=False, allow_blank=True, write_only=True)
    brand = serializers.CharField(required=False, allow_blank=True, write_only=True)
    model_name = serializers.CharField(required=False, allow_blank=True, write_only=True)
    device_equipment = serializers.CharField(required=False, allow_blank=True, write_only=True)
    version_no = serializers.CharField(required=False, allow_blank=True, write_only=True)
    date_purchased = serializers.DateField(required=False, allow_null=True, write_only=True)
    serial_no = serializers.CharField(required=False, allow_blank=True, write_only=True)
    sales_no = serializers.CharField(required=False, allow_blank=True, write_only=True)
    others = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = Ticket
        fields = [
            # Client creation fields (write-only, not model fields)
            'client', 'contact_person', 'address', 'designation',
            'landline', 'department_organization', 'mobile_no', 'email_address',
            'type_of_service', 'type_of_service_others',
            'description_of_problem', 'preferred_support_type',
            'priority', 'assign_to',
            'client_record', 'product_record',
            'estimated_resolution_days_override',
            'is_existing_client',
            # Product creation fields (write-only, not model fields)
            'has_warranty', 'product', 'brand', 'model_name',
            'device_equipment', 'version_no', 'date_purchased', 'serial_no', 'sales_no', 'others',
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
