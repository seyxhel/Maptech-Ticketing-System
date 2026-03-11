from rest_framework import viewsets, status
from django.db.models import Count, Q
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone

from ..models import TicketAttachment
from ..serializers import KnowledgeHubAttachmentSerializer, PublishedArticleSerializer
from ..permissions import IsAdminLevel


class KnowledgeHubViewSet(viewsets.ModelViewSet):
    """
    Admin-side CRUD for proof attachments submitted through STF ticket forms.
    • list      – all proof attachments with parent ticket context
    • retrieve  – single attachment detail
    • publish   – set title + description and mark as published
    • unpublish – remove from employee Knowledge Hub
    • update    – edit published title/description
    • delete    – remove an attachment
    """
    serializer_class = KnowledgeHubAttachmentSerializer
    permission_classes = [IsAuthenticated, IsAdminLevel]
    swagger_tags = ['Knowledge Hub']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return TicketAttachment.objects.none()

        qs = TicketAttachment.objects.select_related(
            'ticket', 'ticket__type_of_service', 'ticket__assigned_to',
            'uploaded_by', 'published_by',
        ).order_by('-uploaded_at')

        show_all = self.request.query_params.get('all', '').lower() in ('true', '1')
        if not show_all:
            qs = qs.filter(is_resolution_proof=True)

        pub = self.request.query_params.get('published')
        if pub is not None and pub != '':
            qs = qs.filter(is_published=pub.lower() in ('true', '1'))

        archived = self.request.query_params.get('archived')
        if archived is not None and archived != '':
            qs = qs.filter(is_archived=archived.lower() in ('true', '1'))

        stf = self.request.query_params.get('stf_no')
        if stf:
            qs = qs.filter(ticket__stf_no__icontains=stf)

        ticket_status = self.request.query_params.get('ticket_status')
        if ticket_status:
            qs = qs.filter(ticket__status=ticket_status)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(ticket__stf_no__icontains=search) |
                Q(ticket__client__icontains=search) |
                Q(ticket__description_of_problem__icontains=search) |
                Q(published_title__icontains=search) |
                Q(published_description__icontains=search) |
                Q(file__icontains=search)
            )

        return qs

    def partial_update(self, request, *args, **kwargs):
        """Update published title/description on a proof attachment."""
        instance = self.get_object()
        title = request.data.get('published_title')
        desc = request.data.get('published_description')
        if title is not None:
            instance.published_title = title
        if desc is not None:
            instance.published_description = desc
        instance.save(update_fields=['published_title', 'published_description'])
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish an attachment to the employee Knowledge Hub."""
        instance = self.get_object()
        title = request.data.get('published_title', '').strip()
        description = request.data.get('published_description', '').strip()
        tags = request.data.get('published_tags', [])
        if not title:
            return Response({'detail': 'published_title is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(tags, list):
            tags = []
        tags = [str(t).strip() for t in tags[:3] if str(t).strip()]
        instance.is_published = True
        instance.published_title = title
        instance.published_description = description
        instance.published_tags = tags
        instance.published_by = request.user
        instance.published_at = timezone.now()
        instance.save(update_fields=[
            'is_published', 'published_title', 'published_description',
            'published_tags', 'published_by', 'published_at',
        ])
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        """Remove an attachment from the employee Knowledge Hub."""
        instance = self.get_object()
        instance.is_published = False
        instance.save(update_fields=['is_published'])
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Move an attachment to the archived section."""
        instance = self.get_object()
        instance.is_archived = True
        instance.save(update_fields=['is_archived'])
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=['post'])
    def unarchive(self, request, pk=None):
        """Restore an attachment from the archived section."""
        instance = self.get_object()
        instance.is_archived = False
        instance.save(update_fields=['is_archived'])
        return Response(self.get_serializer(instance).data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Summary stats for the Knowledge Hub dashboard."""
        qs = TicketAttachment.objects.select_related('ticket')
        total = qs.filter(is_resolution_proof=True).count()
        published_count = qs.filter(is_resolution_proof=True, is_published=True).count()
        unpublished_count = total - published_count
        archived_count = qs.filter(is_resolution_proof=True, is_archived=True).count()
        by_status = dict(
            qs.filter(is_resolution_proof=True)
            .values_list('ticket__status')
            .annotate(c=Count('id'))
            .values_list('ticket__status', 'c')
        )

        return Response({
            'total_proofs': total,
            'published': published_count,
            'unpublished': unpublished_count,
            'archived': archived_count,
            'by_ticket_status': by_status,
        })


class PublishedArticleViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Employee-facing read-only endpoint: returns only published Knowledge Hub items.
    Accessible by any authenticated user.
    """
    serializer_class = PublishedArticleSerializer
    permission_classes = [IsAuthenticated]
    swagger_tags = ['Knowledge Hub']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return TicketAttachment.objects.none()

        qs = TicketAttachment.objects.filter(
            is_published=True,
        ).select_related(
            'ticket', 'uploaded_by', 'published_by',
        ).order_by('-published_at')

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(published_title__icontains=search) |
                Q(published_description__icontains=search)
            )

        return qs
