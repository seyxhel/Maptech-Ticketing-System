from rest_framework import serializers
from ..models import CallLog, FeedbackRating, ServiceReport, ServiceReportAttachment
from tickets.input_security import sanitize_payload


class MultiFileField(serializers.ListField):
    def get_value(self, dictionary):
        if hasattr(dictionary, 'getlist'):
            values = dictionary.getlist(self.field_name)
            if values:
                return values
        return super().get_value(dictionary)


class CallLogSerializer(serializers.ModelSerializer):
    admin_name = serializers.SerializerMethodField()
    duration_seconds = serializers.ReadOnlyField()
    stf_no = serializers.SerializerMethodField()

    class Meta:
        model = CallLog
        fields = [
            'id', 'ticket', 'stf_no', 'admin', 'admin_name', 'client_name',
            'phone_number', 'call_start', 'call_end', 'duration_seconds',
            'created_at',
        ]
        read_only_fields = ['admin', 'admin_name', 'stf_no', 'created_at']

    text_field_rules = {
        'client_name': {'max_length': 200},
        'phone_number': {'max_length': 30},
        'notes': {'max_length': None, 'allow_newlines': True},
    }

    def to_internal_value(self, data):
        return super().to_internal_value(sanitize_payload(data, self.text_field_rules))

    def get_admin_name(self, obj):
        if obj.admin:
            name = obj.admin.get_full_name()
            return name if name.strip() else obj.admin.username
        return ''

    def get_stf_no(self, obj):
        ticket = getattr(obj, 'ticket', None)
        return getattr(ticket, 'stf_no', None) if ticket else None


class FeedbackRatingSerializer(serializers.ModelSerializer):
    admin_name = serializers.SerializerMethodField()
    employee_name = serializers.SerializerMethodField()
    stf_no = serializers.CharField(source='ticket.stf_no', read_only=True)

    class Meta:
        model = FeedbackRating
        fields = [
            'id', 'ticket', 'stf_no', 'employee', 'employee_name',
            'admin', 'admin_name', 'rating', 'comments', 'created_at',
        ]
        read_only_fields = ['admin', 'admin_name', 'employee_name', 'stf_no', 'created_at']

    text_field_rules = {
        'comments': {'max_length': None, 'allow_newlines': True},
    }

    def to_internal_value(self, data):
        return super().to_internal_value(sanitize_payload(data, self.text_field_rules))

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


class ServiceReportAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceReportAttachment
        fields = ['id', 'file', 'created_at']
        read_only_fields = fields


class ServiceReportSerializer(serializers.ModelSerializer):
    sr_no = serializers.CharField(read_only=True)
    ticket_stf = serializers.CharField(source='ticket.stf_no', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    attachments = ServiceReportAttachmentSerializer(many=True, read_only=True)
    attachment_files = MultiFileField(
        child=serializers.FileField(),
        required=False,
        write_only=True,
        allow_empty=True,
    )

    class Meta:
        model = ServiceReport
        fields = [
            'id', 'sr_no', 'ticket', 'ticket_stf', 'created_by', 'created_by_name',
            'report_date', 'time_responded', 'time_completed',
            'contact_no', 'type_of_service', 'type_of_support',
            'description_of_trouble', 'action_taken', 'remarks', 'status',
            'product_name', 'product_title', 'device_equipment', 'serial_no', 'product_remarks',
            'attachment', 'attachments', 'attachment_files', 'created_at', 'updated_at',
        ]
        read_only_fields = ['sr_no', 'created_by', 'created_by_name', 'created_at', 'updated_at', 'ticket_stf']

    text_field_rules = {
        'contact_no': {'max_length': 60},
        'type_of_service': {'max_length': 200},
        'type_of_support': {'max_length': 120},
        'description_of_trouble': {'max_length': None, 'allow_newlines': True},
        'action_taken': {'max_length': None, 'allow_newlines': True},
        'remarks': {'max_length': None, 'allow_newlines': True},
    }

    def to_internal_value(self, data):
        return super().to_internal_value(sanitize_payload(data, self.text_field_rules))

    def get_created_by_name(self, obj):
        if obj.created_by:
            name = obj.created_by.get_full_name()
            return name if name.strip() else obj.created_by.username
        return ''

    def create(self, validated_data):
        request = self.context.get('request')
        attachment_files = validated_data.pop('attachment_files', [])
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        if attachment_files:
            validated_data['attachment'] = attachment_files[0]
        report = super().create(validated_data)

        files_to_save = attachment_files or []
        legacy_attachment = report.attachment
        if legacy_attachment and not files_to_save:
                        files_to_save = [legacy_attachment]

        for file_obj in files_to_save:
            ServiceReportAttachment.objects.create(service_report=report, file=file_obj)

        return report

    def validate(self, attrs):
        # Ensure report_date is not earlier than the ticket's creation date
        ticket = attrs.get('ticket') if 'ticket' in attrs else (self.instance.ticket if self.instance else None)
        report_date = attrs.get('report_date') if 'report_date' in attrs else (self.instance.report_date if self.instance else None)
        if ticket and report_date:
            ticket_date = getattr(ticket, 'date', None)
            if ticket_date and report_date < ticket_date:
                raise serializers.ValidationError({
                    'report_date': 'Report date cannot be earlier than the STF creation date.'
                })
        return attrs
