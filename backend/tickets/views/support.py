from rest_framework import viewsets, status
from django.db.models import Q
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone

from ..models import CallLog, CSATFeedback
from ..serializers import CallLogSerializer, CSATFeedbackSerializer
from ..permissions import IsAdminLevel


class CallLogViewSet(viewsets.ModelViewSet):
    """CRUD for call logs. Admin creates, all admin-level can list."""
    queryset = CallLog.objects.all().order_by('-call_start')
    serializer_class = CallLogSerializer
    permission_classes = [IsAuthenticated, IsAdminLevel]
    swagger_tags = ['Call Logs']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return CallLog.objects.none()
        qs = CallLog.objects.all().order_by('-call_start')

        ticket_id = self.request.query_params.get('ticket')
        if ticket_id:
            qs = qs.filter(ticket_id=ticket_id)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(client_name__icontains=search) |
                Q(phone_number__icontains=search) |
                Q(notes__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        serializer.save(admin=self.request.user)

    @action(detail=True, methods=['post'])
    def end_call(self, request, pk=None):
        """End an active call (sets call_end to now)."""
        call_log = self.get_object()
        if call_log.call_end:
            return Response({'detail': 'Call already ended.'}, status=status.HTTP_400_BAD_REQUEST)
        call_log.call_end = timezone.now()
        notes = request.data.get('notes')
        if notes:
            call_log.notes = notes
        call_log.save()
        return Response(CallLogSerializer(call_log).data)


class CSATFeedbackViewSet(viewsets.ModelViewSet):
    """Admin submits CSAT feedback on employee performance before closing a ticket."""
    queryset = CSATFeedback.objects.all().order_by('-created_at')
    serializer_class = CSATFeedbackSerializer
    permission_classes = [IsAuthenticated, IsAdminLevel]
    swagger_tags = ['CSAT Feedback']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return CSATFeedback.objects.none()
        qs = CSATFeedback.objects.all().order_by('-created_at')

        ticket_id = self.request.query_params.get('ticket')
        if ticket_id:
            qs = qs.filter(ticket_id=ticket_id)

        employee_id = self.request.query_params.get('employee')
        if employee_id:
            qs = qs.filter(employee_id=employee_id)

        return qs

    def perform_create(self, serializer):
        serializer.save(admin=self.request.user)
