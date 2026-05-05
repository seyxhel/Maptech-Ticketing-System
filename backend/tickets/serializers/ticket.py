from rest_framework import serializers
from django.utils import timezone
import re
from ..models import (
    Ticket, TicketTask, TicketAttachment, EscalationLog, AuditLog,
)
from tickets.input_security import sanitize_payload
from users.serializers import UserSerializer
from .lookup import TypeOfServiceSerializer
from .client import ClientSerializer
from .product import ProductSerializer
from .support import FeedbackRatingSerializer
from .audit import EscalationLogSerializer


# Phone validation pattern for Philippine numbers
PHONE_PATTERN = re.compile(r'^(\+63|0)?9\d{9}$')


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
    supervisor = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    tasks = TicketTaskSerializer(many=True, read_only=True)
    attachments = TicketAttachmentSerializer(many=True, read_only=True)
    type_of_service_detail = TypeOfServiceSerializer(source='type_of_service', read_only=True)
    escalation_logs = EscalationLogSerializer(many=True, read_only=True)
    client_record_detail = ClientSerializer(source='client_record', read_only=True)
    product_record_detail = ProductSerializer(source='product_record', read_only=True)
    progress_percentage = serializers.ReadOnlyField()
    sla_estimated_days = serializers.ReadOnlyField()
    feedback_rating = FeedbackRatingSerializer(read_only=True)
    linked_ticket_ids = serializers.PrimaryKeyRelatedField(
        source='linked_tickets', many=True, read_only=True,
    )
    linked_ticket_stfs = serializers.SerializerMethodField()
    was_for_observation = serializers.SerializerMethodField()
    type_of_service_others = serializers.SerializerMethodField()

    text_field_rules = {
        'description_of_problem': {'max_length': None, 'allow_newlines': True},
        'action_taken': {'max_length': None, 'allow_newlines': True},
        'remarks': {'max_length': None, 'allow_newlines': True},
        'cascade_type': {'max_length': 20},
        'observation': {'max_length': None, 'allow_newlines': True},
        'signature': {'max_length': None, 'allow_newlines': True, 'strip_tags': False},
        'signed_by_name': {'max_length': 200},
        'external_escalated_to': {'max_length': 300},
        'external_escalation_notes': {'max_length': None, 'allow_newlines': True},
    }

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
    firmware_version = serializers.SerializerMethodField()
    software_name = serializers.SerializerMethodField()
    software_version = serializers.SerializerMethodField()
    software_vendor = serializers.SerializerMethodField()
    software_license_key = serializers.SerializerMethodField()
    software_metadata = serializers.SerializerMethodField()
    date_purchased = serializers.SerializerMethodField()
    serial_no = serializers.SerializerMethodField()
    sales_no = serializers.SerializerMethodField()
    others = serializers.SerializerMethodField()
    client_purchase_no = serializers.SerializerMethodField()
    maptech_dr = serializers.SerializerMethodField()
    maptech_sales_invoice = serializers.SerializerMethodField()
    maptech_sales_order_no = serializers.SerializerMethodField()
    supplier_purchase_no = serializers.SerializerMethodField()
    supplier_sales_invoice = serializers.SerializerMethodField()
    supplier_delivery_receipt = serializers.SerializerMethodField()

    # Role-based writable fields
    TICKET_FIELDS = {
        'type_of_service', 'type_of_service_others',
        'preferred_support_type', 'description_of_problem',
        'priority', 'client_record', 'product_record',
        'estimated_resolution_days_override',
    }
    PRODUCT_FIELDS = {
        'product_name', 'brand', 'model_name', 'device_equipment',
        'version_no', 'firmware_version', 'software_name', 'software_version', 'software_vendor', 'software_license_key', 'software_metadata',
        'date_purchased', 'serial_no', 'sales_no',
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
            'created_by', 'supervisor', 'assigned_to', 'tasks', 'created_at', 'updated_at',
            # New fields
            'stf_no', 'date', 'time_in', 'time_out',
            # Client info – read-only, served via client_record
            'client', 'contact_person', 'address', 'designation',
            'landline', 'department_organization', 'mobile_no', 'email_address',
            'type_of_service', 'type_of_service_detail', 'type_of_service_others',
            'priority', 'confirmed_by_admin',
            'preferred_support_type', 'description_of_problem',
            'client_purchase_no', 'maptech_dr', 'maptech_sales_invoice', 'maptech_sales_order_no',
            'supplier_purchase_no', 'supplier_sales_invoice', 'supplier_delivery_receipt',
            'product', 'brand', 'model_name',
            'device_equipment', 'version_no', 'firmware_version', 'software_name', 'software_version', 'software_vendor', 'software_license_key', 'software_metadata',
            'date_purchased', 'serial_no', 'sales_no', 'others',
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
            'feedback_rating',
            'linked_ticket_ids', 'linked_ticket_stfs',
            'was_for_observation',
        ]
        read_only_fields = ['stf_no', 'date', 'time_in', 'time_out', 'confirmed_by_admin',
                            'external_escalated_to', 'external_escalation_notes', 'external_escalated_at',
                            'progress_percentage', 'sla_estimated_days']

    def to_internal_value(self, data):
        return super().to_internal_value(sanitize_payload(data, self.text_field_rules))

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

    def get_firmware_version(self, obj):
        return self._product_field(obj, 'firmware_version')

    def get_software_name(self, obj):
        return self._product_field(obj, 'software_name')

    def get_software_version(self, obj):
        return self._product_field(obj, 'software_version')

    def get_software_vendor(self, obj):
        return self._product_field(obj, 'software_vendor')

    def get_software_license_key(self, obj):
        return self._product_field(obj, 'software_license_key')

    def get_software_metadata(self, obj):
        return self._product_field(obj, 'software_metadata')

    def get_date_purchased(self, obj):
        return self._product_field(obj, 'date_purchased')

    def get_serial_no(self, obj):
        return self._product_field(obj, 'serial_no')

    def get_sales_no(self, obj):
        return self._product_field(obj, 'sales_no')

    def get_others(self, obj):
        return self._product_field(obj, 'others')

    def get_client_purchase_no(self, obj):
        return self._product_field(obj, 'client_purchase_no')

    def get_maptech_dr(self, obj):
        return self._product_field(obj, 'maptech_dr')

    def get_maptech_sales_invoice(self, obj):
        return self._product_field(obj, 'maptech_sales_invoice')

    def get_maptech_sales_order_no(self, obj):
        return self._product_field(obj, 'maptech_sales_order_no')

    def get_supplier_purchase_no(self, obj):
        return self._product_field(obj, 'supplier_purchase_no')

    def get_supplier_sales_invoice(self, obj):
        return self._product_field(obj, 'supplier_sales_invoice')

    def get_supplier_delivery_receipt(self, obj):
        return self._product_field(obj, 'supplier_delivery_receipt')

    def get_was_for_observation(self, obj):
        if obj.status == Ticket.STATUS_FOR_OBSERVATION:
            return True
        if obj.observation:
            return True
        return AuditLog.objects.filter(
            entity=AuditLog.ENTITY_TICKET, entity_id=str(obj.id), action=AuditLog.ACTION_OBSERVE
        ).exists()

    def get_type_of_service_others(self, obj):
        tos = getattr(obj, 'type_of_service', None)
        if not tos:
            return ''
        return tos.type_of_service_others or ''

    def _sync_type_of_service_others(self, ticket):
        """Persist optional input onto the selected TypeOfService record."""
        others_value = self.initial_data.get('type_of_service_others')
        if others_value is None:
            return
        tos = getattr(ticket, 'type_of_service', None)
        if not tos:
            return
        tos.type_of_service_others = others_value
        tos.save(update_fields=['type_of_service_others'])

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
        ticket = super().update(instance, filtered)
        self._sync_type_of_service_others(ticket)
        return ticket

    def create(self, validated_data):
        allowed = self._get_allowed_fields()
        # Always allow `created_by` to pass through (set by the view),
        # even if it's not in the role-writable fields.
        filtered = {k: v for k, v in validated_data.items() if k in allowed or k == 'created_by'}
        ticket = super().create(filtered)
        self._sync_type_of_service_others(ticket)
        return ticket


class AdminCreateTicketSerializer(serializers.ModelSerializer):
    """Form shown to admins when creating a new ticket.
    Includes priority and assign_to so the admin can set them during the call flow."""
    assign_to = serializers.IntegerField(required=False, write_only=True, help_text='Employee ID to assign')
    supervisor_id = serializers.IntegerField(required=False, write_only=True, help_text='Supervisor ID for sales-created tickets')
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
    sales_representative = serializers.CharField(required=False, allow_blank=True, write_only=True)
    # Write-only product fields – used to auto-create a Product record
    has_warranty = serializers.BooleanField(required=False, default=False, write_only=True)
    product = serializers.CharField(required=False, allow_blank=True, write_only=True)
    brand = serializers.CharField(required=False, allow_blank=True, write_only=True)
    model_name = serializers.CharField(required=False, allow_blank=True, write_only=True)
    device_equipment = serializers.CharField(required=False, allow_blank=True, write_only=True)
    version_no = serializers.CharField(required=False, allow_blank=True, write_only=True)
    firmware_version = serializers.CharField(required=False, allow_blank=True, write_only=True)
    software_name = serializers.CharField(required=False, allow_blank=True, write_only=True)
    software_version = serializers.CharField(required=False, allow_blank=True, write_only=True)
    software_vendor = serializers.CharField(required=False, allow_blank=True, write_only=True)
    software_license_key = serializers.CharField(required=False, allow_blank=True, write_only=True)
    software_metadata = serializers.CharField(required=False, allow_blank=True, write_only=True)
    date_purchased = serializers.DateField(required=False, allow_null=True, write_only=True)
    serial_no = serializers.CharField(required=False, allow_blank=True, write_only=True)
    sales_no = serializers.CharField(required=False, allow_blank=True, write_only=True)
    others = serializers.CharField(required=False, allow_blank=True, write_only=True)
    client_purchase_no = serializers.CharField(required=False, allow_blank=True, write_only=True)
    maptech_dr = serializers.CharField(required=False, allow_blank=True, write_only=True)
    maptech_sales_invoice = serializers.CharField(required=False, allow_blank=True, write_only=True)
    maptech_sales_order_no = serializers.CharField(required=False, allow_blank=True, write_only=True)
    supplier_purchase_no = serializers.CharField(required=False, allow_blank=True, write_only=True)
    supplier_sales_invoice = serializers.CharField(required=False, allow_blank=True, write_only=True)
    supplier_delivery_receipt = serializers.CharField(required=False, allow_blank=True, write_only=True)
    type_of_service_others = serializers.CharField(required=False, allow_blank=True, write_only=True)
    project_title = serializers.CharField(required=False, allow_blank=True, write_only=True)
    client_unavailable_for_call = serializers.BooleanField(required=False, default=False, write_only=True)

    text_field_rules = {
        'client': {'max_length': 500},
        'contact_person': {'max_length': 200},
        'address': {'max_length': None, 'allow_newlines': True},
        'designation': {'max_length': 200},
        'landline': {'max_length': 30},
        'department_organization': {'max_length': 200},
        'mobile_no': {'max_length': 20},
        'email_address': {'max_length': 254},
        'sales_representative': {'max_length': 200},
        'description_of_problem': {'max_length': None, 'allow_newlines': True},
        'product': {'max_length': 300},
        'brand': {'max_length': 300},
        'model_name': {'max_length': 300},
        'device_equipment': {'max_length': 300},
        'version_no': {'max_length': 100},
        'firmware_version': {'max_length': 120},
        'software_name': {'max_length': 300},
        'software_version': {'max_length': 120},
        'software_vendor': {'max_length': 300},
        'software_license_key': {'max_length': 300},
        'software_metadata': {'max_length': None, 'allow_newlines': True},
        'serial_no': {'max_length': 200},
        'sales_no': {'max_length': 200},
        'others': {'max_length': None, 'allow_newlines': True},
        'client_purchase_no': {'max_length': 200},
        'maptech_dr': {'max_length': 200},
        'maptech_sales_invoice': {'max_length': 200},
        'maptech_sales_order_no': {'max_length': 200},
        'supplier_purchase_no': {'max_length': 200},
        'supplier_sales_invoice': {'max_length': 200},
        'supplier_delivery_receipt': {'max_length': 200},
        'type_of_service_others': {'max_length': 200},
        'project_title': {'max_length': 300},
    }

    class Meta:
        model = Ticket
        fields = [
            # Client creation fields (write-only, not model fields)
            'client', 'contact_person', 'address', 'designation',
            'landline', 'department_organization', 'mobile_no', 'email_address',
            'sales_representative',
            'type_of_service', 'type_of_service_others',
            'description_of_problem', 'preferred_support_type',
            'priority', 'assign_to',
            'supervisor_id',
            'client_unavailable_for_call',
            'client_record', 'product_record',
            'estimated_resolution_days_override',
            'is_existing_client',
            # Product creation fields (write-only, not model fields)
            'has_warranty', 'product', 'brand', 'model_name',
            'device_equipment', 'version_no', 'firmware_version', 'software_name', 'software_version', 'software_vendor', 'software_license_key', 'software_metadata',
            'date_purchased', 'serial_no', 'sales_no', 'others',
            'project_title',
            # Additional product detail fields (stored on Product)
            'client_purchase_no', 'maptech_dr', 'maptech_sales_invoice', 'maptech_sales_order_no',
            'supplier_purchase_no', 'supplier_sales_invoice', 'supplier_delivery_receipt',
        ]
        extra_kwargs = {
            'email_address': {'required': False, 'allow_blank': True, 'default': ''},
        }

    def to_internal_value(self, data):
        return super().to_internal_value(sanitize_payload(data, self.text_field_rules))

    def validate_mobile_no(self, value):
        """Validate Philippine mobile number format."""
        if value:
            cleaned = value.replace(' ', '').replace('-', '')
            if not PHONE_PATTERN.match(cleaned):
                raise serializers.ValidationError(
                    'Invalid phone format. Use +639XXXXXXXXX or 09XXXXXXXXX'
                )
        return value

    def validate_date_purchased(self, value):
        """Ensure date_purchased is not in the future."""
        if value and value > timezone.now().date():
            raise serializers.ValidationError('Purchase date cannot be in the future.')
        return value

    def validate_client(self, value):
        """Validate client name is not too long."""
        if value and len(value) > 500:
            raise serializers.ValidationError('Client name must be 500 characters or less.')
        return value

    def validate(self, attrs):
        """Cross-field validation."""
        is_existing = attrs.get('is_existing_client', False)
        client_record = attrs.get('client_record')
        client_name = attrs.get('client', '')

        # If not using existing client, require client name
        if not is_existing and not client_record and not client_name:
            raise serializers.ValidationError({
                'client': 'Client name is required when not using an existing client.'
            })

        return attrs


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

    text_field_rules = {
        'product': {'max_length': 300},
        'brand': {'max_length': 300},
        'model_name': {'max_length': 300},
        'device_equipment': {'max_length': 300},
        'version_no': {'max_length': 100},
        'serial_no': {'max_length': 200},
        'action_taken': {'max_length': None, 'allow_newlines': True},
        'remarks': {'max_length': None, 'allow_newlines': True},
        'observation': {'max_length': None, 'allow_newlines': True},
        'signature': {'max_length': None, 'allow_newlines': True, 'strip_tags': False},
        'signed_by_name': {'max_length': 200},
    }

    def to_internal_value(self, data):
        return super().to_internal_value(sanitize_payload(data, self.text_field_rules))

    def validate_date_purchased(self, value):
        """Ensure date_purchased is not in the future."""
        if value and value > timezone.now().date():
            raise serializers.ValidationError('Purchase date cannot be in the future.')
        return value
