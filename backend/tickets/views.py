from rest_framework import viewsets, status
from django.db import IntegrityError
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
User = get_user_model()
from django.conf import settings as django_settings
from django.utils import timezone
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from .models import Ticket, TicketTask, Template
from .serializers import TicketSerializer, TemplateSerializer
from users.serializers import RegisterSerializer, UserSerializer


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all().order_by('-created_at')
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.ROLE_ADMIN:
            return Ticket.objects.all().order_by('-created_at')
        if user.role == User.ROLE_EMPLOYEE:
            return Ticket.objects.filter(assigned_to=user).order_by('-created_at')
        # client
        return Ticket.objects.filter(created_by=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def assign(self, request, pk=None):
        # admin only
        if request.user.role != User.ROLE_ADMIN:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        ticket = self.get_object()
        employee_id = request.data.get('employee_id')
        template_id = request.data.get('template_id')
        if not employee_id:
            return Response({'detail': 'employee_id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            emp = User.objects.get(id=employee_id, role=User.ROLE_EMPLOYEE)
        except User.DoesNotExist:
            return Response({'detail': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

        old_employee = ticket.assigned_to

        # End previous assignment session
        if ticket.current_session:
            prev_session = ticket.current_session
            prev_session.is_active = False
            prev_session.ended_at = timezone.now()
            prev_session.save()

            # Force-disconnect old employee from WebSocket
            if old_employee and old_employee.id != emp.id:
                self._send_force_disconnect(ticket.id, old_employee)

        # Create new assignment session
        new_session = AssignmentSession.objects.create(ticket=ticket, employee=emp)

        ticket.assigned_to = emp
        ticket.current_session = new_session
        ticket.status = Ticket.STATUS_OPEN
        ticket.save()

        # Create system message about reassignment (in both channels)
        if old_employee and old_employee.id != emp.id:
            sys_content = f"Employee changed from {old_employee.get_full_name() or old_employee.username} to {emp.get_full_name() or emp.username}"
            for ch in ['client_employee', 'admin_employee']:
                Message.objects.create(
                    ticket=ticket,
                    assignment_session=new_session,
                    channel_type=ch,
                    sender=request.user,
                    content=sys_content,
                    is_system_message=True,
                )
                # Broadcast system message via channel layer
                self._broadcast_system_message(ticket.id, ch, sys_content, request.user)

        # create tasks from template if provided
        if template_id:
            try:
                tpl = Template.objects.get(id=template_id)
                steps = [s.strip() for s in tpl.steps.splitlines() if s.strip()]
                for step in steps:
                    TicketTask.objects.create(ticket=ticket, description=step, assigned_to=emp)
            except Template.DoesNotExist:
                pass
        return Response(self.get_serializer(ticket).data)

    @staticmethod
    def _send_force_disconnect(ticket_id, old_employee):
        """Send force_disconnect to old employee's WebSocket channels."""
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        if channel_layer:
            for ch in ['client_employee', 'admin_employee']:
                group = f'chat_{ticket_id}_{ch}'
                async_to_sync(channel_layer.group_send)(group, {
                    'type': 'force_disconnect',
                    'reason': 'You have been unassigned from this ticket.',
                })

    @staticmethod
    def _broadcast_system_message(ticket_id, channel_type, content, sender):
        """Broadcast a system message to the WS group."""
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        if channel_layer:
            group = f'chat_{ticket_id}_{channel_type}'
            async_to_sync(channel_layer.group_send)(group, {
                'type': 'system_message',
                'message': {
                    'id': None,
                    'sender_id': sender.id,
                    'sender_username': sender.username,
                    'sender_role': sender.role,
                    'content': content,
                    'reply_to': None,
                    'is_system_message': True,
                    'reactions': {},
                    'read_by': [],
                    'created_at': timezone.now().isoformat(),
                },
            })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def escalate(self, request, pk=None):
        ticket = self.get_object()
        user = request.user
        if user.role != User.ROLE_EMPLOYEE or ticket.assigned_to != user:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        ticket.status = Ticket.STATUS_ESCALATED
        ticket.assigned_to = None
        ticket.save()
        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def pass_ticket(self, request, pk=None):
        # employee can pass to another employee
        ticket = self.get_object()
        user = request.user
        if user.role != User.ROLE_EMPLOYEE or ticket.assigned_to != user:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        to_emp_id = request.data.get('employee_id')
        if not to_emp_id:
            return Response({'detail': 'employee_id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            to_emp = User.objects.get(id=to_emp_id, role=User.ROLE_EMPLOYEE)
        except User.DoesNotExist:
            return Response({'detail': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        ticket.assigned_to = to_emp
        ticket.save()
        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def review(self, request, pk=None):
        """Admin reviews a ticket — populates time_in and optionally sets priority."""
        if request.user.role != User.ROLE_ADMIN:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        ticket = self.get_object()
        if not ticket.time_in:
            ticket.time_in = timezone.now()
        priority = request.data.get('priority')
        if priority and priority in dict(Ticket.PRIORITY_CHOICES):
            ticket.priority = priority
        ticket.save()
        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_employee_fields(self, request, pk=None):
        """Employee updates their specific fields on a ticket."""
        ticket = self.get_object()
        user = request.user
        if user.role != User.ROLE_EMPLOYEE or ticket.assigned_to != user:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        allowed = [
            'preferred_support_type', 'device_equipment', 'version_no',
            'date_purchased', 'serial_no', 'description_of_problem',
            'action_taken', 'remarks', 'job_status',
        ]
        for field in allowed:
            if field in request.data:
                setattr(ticket, field, request.data[field])
        ticket.save()
        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'], url_path='upload_attachment', permission_classes=[IsAuthenticated])
    def upload_attachment(self, request, pk=None):
        """Upload file attachments to a ticket."""
        ticket = self.get_object()
        files = request.FILES.getlist('files')
        if not files:
            return Response({'detail': 'No files provided.'}, status=status.HTTP_400_BAD_REQUEST)
        attachments = []
        for f in files:
            att = TicketAttachment.objects.create(ticket=ticket, file=f, uploaded_by=request.user)
            attachments.append(att)
        return Response(TicketAttachmentSerializer(attachments, many=True).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='delete_attachment/(?P<att_id>[0-9]+)', permission_classes=[IsAuthenticated])
    def delete_attachment(self, request, pk=None, att_id=None):
        """Delete a file attachment from a ticket."""
        ticket = self.get_object()
        try:
            att = TicketAttachment.objects.get(id=att_id, ticket=ticket)
        except TicketAttachment.DoesNotExist:
            return Response({'detail': 'Attachment not found.'}, status=status.HTTP_404_NOT_FOUND)
        att.file.delete(save=False)
        att.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)





class TemplateViewSet(viewsets.ModelViewSet):
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # only admins manage templates
        if self.request.user.role == User.ROLE_ADMIN:
            return Template.objects.all()
        return Template.objects.none()


class TypeOfServiceViewSet(viewsets.ModelViewSet):
    """CRUD for Type of Service (admin manages, all authenticated can list active)."""
    queryset = TypeOfService.objects.all().order_by('name')
    serializer_class = TypeOfServiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == User.ROLE_ADMIN:
            return TypeOfService.objects.all().order_by('name')
        # Non-admins only see active services (for dropdown)
        return TypeOfService.objects.filter(is_active=True).order_by('name')

