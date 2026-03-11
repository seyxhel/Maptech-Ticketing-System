from rest_framework import serializers
from ..models import TicketAttachment
from users.serializers import UserSerializer


class KnowledgeHubAttachmentSerializer(serializers.ModelSerializer):
    """Flat representation of a proof attachment with parent ticket context (admin view)."""
    uploaded_by = UserSerializer(read_only=True)
    published_by_detail = UserSerializer(source='published_by', read_only=True)
    ticket_id = serializers.IntegerField(source='ticket.id', read_only=True)
    stf_no = serializers.CharField(source='ticket.stf_no', read_only=True)
    ticket_status = serializers.CharField(source='ticket.status', read_only=True)
    client = serializers.SerializerMethodField()
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

    def get_client(self, obj):
        if obj.ticket and obj.ticket.client_record:
            return obj.ticket.client_record.client_name
        return ''

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
