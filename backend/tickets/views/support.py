from rest_framework import viewsets, status
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from django.contrib.auth import get_user_model

from tickets.input_security import clean_text

from ..models import CallLog, FeedbackRating
from ..serializers import CallLogSerializer, FeedbackRatingSerializer
from ..models import ServiceReport
from ..serializers import ServiceReportSerializer
from ..permissions import IsAdminLevel

User = get_user_model()


class ServiceReportPagination(PageNumberPagination):
    page_size = 4
    page_size_query_param = 'page_size'
    max_page_size = 100


class CallLogViewSet(viewsets.ModelViewSet):
    """CRUD for call logs. Scoped to ticket participants."""
    queryset = CallLog.objects.all().order_by('-call_start')
    serializer_class = CallLogSerializer
    permission_classes = [IsAuthenticated]
    swagger_tags = ['Call Logs']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return CallLog.objects.none()
        user = self.request.user
        qs = CallLog.objects.all().order_by('-call_start')

        if user.role == User.ROLE_EMPLOYEE:
            qs = qs.filter(ticket__assigned_to=user)
        elif user.role == User.ROLE_SALES:
            qs = qs.filter(
                Q(admin=user) |
                Q(ticket__created_by=user) |
                Q(ticket__supervisor=user)
            )
        elif user.role == User.ROLE_ADMIN:
            qs = qs.filter(
                Q(admin=user) |
                Q(ticket__created_by=user) |
                Q(ticket__supervisor=user)
            )
        elif user.role == User.ROLE_SUPERADMIN:
            # Superadmin can review the full call log history.
            qs = qs
        else:
            return CallLog.objects.none()

        ticket_id = self.request.query_params.get('ticket')
        if ticket_id:
            qs = qs.filter(ticket_id=ticket_id)

        active_only = self.request.query_params.get('active')
        if active_only in ('1', 'true', 'True'):
            qs = qs.filter(call_end__isnull=True)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(client_name__icontains=search) |
                Q(phone_number__icontains=search) |
                Q(notes__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        ticket = serializer.validated_data.get('ticket')

        if ticket:
            is_ticket_participant = (
                ticket.created_by_id == user.id
                or getattr(ticket, 'supervisor_id', None) == user.id
                or ticket.assigned_to_id == user.id
            )
            if not is_ticket_participant:
                raise ValidationError({'detail': 'You are not allowed to start a call for this ticket.'})

            active_call = CallLog.objects.filter(ticket=ticket, call_end__isnull=True).first()
            if active_call:
                raise ValidationError({'detail': 'A call is already in progress for this ticket.'})

        serializer.save(admin=user)

    @action(detail=True, methods=['post'])
    def end_call(self, request, pk=None):
        """End an active call (sets call_end to now)."""
        call_log = self.get_object()
        if call_log.call_end:
            return Response({'detail': 'Call already ended.'}, status=status.HTTP_400_BAD_REQUEST)
        call_log.call_end = timezone.now()
        notes = request.data.get('notes')
        if notes:
            call_log.notes = clean_text(notes, allow_newlines=True)
        call_log.save()
        return Response(CallLogSerializer(call_log).data)


class FeedbackRatingViewSet(viewsets.ModelViewSet):
    """Admin submits feedback ratings on employee performance before closing a ticket."""
    queryset = FeedbackRating.objects.all().order_by('-created_at')
    serializer_class = FeedbackRatingSerializer
    permission_classes = [IsAuthenticated, IsAdminLevel]
    swagger_tags = ['Feedback Ratings']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return FeedbackRating.objects.none()
        qs = FeedbackRating.objects.all().order_by('-created_at')

        ticket_id = self.request.query_params.get('ticket')
        if ticket_id:
            qs = qs.filter(ticket_id=ticket_id)

        employee_id = self.request.query_params.get('employee')
        if employee_id:
            qs = qs.filter(employee_id=employee_id)

        return qs

    def perform_create(self, serializer):
        serializer.save(admin=self.request.user)


class ServiceReportViewSet(viewsets.ModelViewSet):
    """CRUD for service reports attached to tickets."""
    queryset = ServiceReport.objects.all().order_by('-created_at')
    serializer_class = ServiceReportSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = ServiceReportPagination
    swagger_tags = ['Service Reports']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return ServiceReport.objects.none()
        qs = ServiceReport.objects.all().order_by('-created_at')
        ticket_id = self.request.query_params.get('ticket')
        if ticket_id:
            qs = qs.filter(ticket_id=ticket_id)
        # Non-admins may only see reports for tickets they are related to
        user = self.request.user
        if user.role not in (User.ROLE_ADMIN, User.ROLE_SUPERADMIN):
            qs = qs.filter(
                Q(ticket__created_by=user) | Q(ticket__assigned_to=user) | Q(ticket__supervisor=user) | Q(created_by=user)
            )
        return qs

    def perform_create(self, serializer):
        # Ensure user is participant of ticket if ticket provided
        user = self.request.user
        ticket = serializer.validated_data.get('ticket')
        if ticket:
            is_participant = (
                ticket.created_by_id == user.id or
                getattr(ticket, 'supervisor_id', None) == user.id or
                ticket.assigned_to_id == user.id
            )
            if not is_participant and user.role not in (User.ROLE_ADMIN, User.ROLE_SUPERADMIN):
                raise ValidationError({'detail': 'You are not allowed to create a service report for this ticket.'})
        serializer.save(created_by=user)
