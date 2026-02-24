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
from .models import Ticket, TicketTask, Template, TypeOfService, TicketAttachment, AssignmentSession, Message, EscalationLog, CSATSurvey
from .serializers import TicketSerializer, TemplateSerializer, TypeOfServiceSerializer, TicketAttachmentSerializer, CSATSurveySerializer, EscalationLogSerializer
from users.serializers import RegisterSerializer, UserSerializer


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all().order_by('-created_at')
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin_level:
            return Ticket.objects.all().order_by('-created_at')
        if user.role == User.ROLE_EMPLOYEE:
            return Ticket.objects.filter(assigned_to=user).order_by('-created_at')
        # client
        return Ticket.objects.filter(created_by=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def assign(self, request, pk=None):
        # admin / superadmin only
        if not request.user.is_admin_level:
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
        """Employee escalates ticket internally — logs escalation, keeps ticket for supervisor to reassign."""
        ticket = self.get_object()
        user = request.user
        if user.role != User.ROLE_EMPLOYEE or ticket.assigned_to != user:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        notes = request.data.get('notes', '')

        # End current session
        if ticket.current_session:
            prev_session = ticket.current_session
            prev_session.is_active = False
            prev_session.ended_at = timezone.now()
            prev_session.save()

        # Log escalation
        EscalationLog.objects.create(
            ticket=ticket,
            escalation_type=EscalationLog.ESCALATION_INTERNAL,
            from_user=user,
            notes=notes,
        )

        ticket.status = Ticket.STATUS_ESCALATED
        ticket.assigned_to = None
        ticket.current_session = None
        ticket.save()

        # System message
        sys_content = f"{user.get_full_name() or user.username} escalated this ticket internally."
        if notes:
            sys_content += f" Notes: {notes}"
        for ch in ['client_employee', 'admin_employee']:
            Message.objects.create(
                ticket=ticket,
                channel_type=ch,
                sender=user,
                content=sys_content,
                is_system_message=True,
            )
            self._broadcast_system_message(ticket.id, ch, sys_content, user)

        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def pass_ticket(self, request, pk=None):
        """Employee passes ticket to another employee — full session management."""
        ticket = self.get_object()
        user = request.user
        if user.role != User.ROLE_EMPLOYEE or ticket.assigned_to != user:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        to_emp_id = request.data.get('employee_id')
        notes = request.data.get('notes', '')
        if not to_emp_id:
            return Response({'detail': 'employee_id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            to_emp = User.objects.get(id=to_emp_id, role=User.ROLE_EMPLOYEE)
        except User.DoesNotExist:
            return Response({'detail': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

        # End previous assignment session
        if ticket.current_session:
            prev_session = ticket.current_session
            prev_session.is_active = False
            prev_session.ended_at = timezone.now()
            prev_session.save()
            # Force-disconnect old employee from WebSocket
            self._send_force_disconnect(ticket.id, user)

        # Create new assignment session
        new_session = AssignmentSession.objects.create(ticket=ticket, employee=to_emp)

        # Log as internal escalation/reassignment
        EscalationLog.objects.create(
            ticket=ticket,
            escalation_type=EscalationLog.ESCALATION_INTERNAL,
            from_user=user,
            to_user=to_emp,
            notes=notes,
        )

        ticket.assigned_to = to_emp
        ticket.current_session = new_session
        ticket.save()

        # System messages
        sys_content = f"Ticket passed from {user.get_full_name() or user.username} to {to_emp.get_full_name() or to_emp.username}"
        if notes:
            sys_content += f". Notes: {notes}"
        for ch in ['client_employee', 'admin_employee']:
            Message.objects.create(
                ticket=ticket,
                assignment_session=new_session,
                channel_type=ch,
                sender=user,
                content=sys_content,
                is_system_message=True,
            )
            self._broadcast_system_message(ticket.id, ch, sys_content, user)

        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def review(self, request, pk=None):
        """Admin/Superadmin reviews a ticket — populates time_in and optionally sets priority."""
        if not request.user.is_admin_level:
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
            'has_warranty', 'product', 'brand', 'model_name',
            'device_equipment', 'version_no',
            'date_purchased', 'serial_no',
            'action_taken', 'remarks', 'job_status',
        ]
        for field in allowed:
            if field in request.data:
                setattr(ticket, field, request.data[field])
        # Set status to in_progress if still open
        if ticket.status == Ticket.STATUS_OPEN:
            ticket.status = Ticket.STATUS_IN_PROGRESS
        ticket.save()
        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def confirm_ticket(self, request, pk=None):
        """Admin confirms they've contacted the client and verified the issue."""
        if request.user.role != User.ROLE_ADMIN:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        ticket = self.get_object()
        ticket.confirmed_by_admin = True
        ticket.save()
        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def escalate_external(self, request, pk=None):
        """Admin or assigned employee escalates to distributor/principal (external).
        Once externally escalated, the ticket cannot bounce back — resolution must occur externally."""
        user = request.user
        ticket = self.get_object()
        if user.role not in (User.ROLE_ADMIN, User.ROLE_EMPLOYEE):
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        if user.role == User.ROLE_EMPLOYEE and ticket.assigned_to != user:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)

        escalated_to = request.data.get('escalated_to', '')
        notes = request.data.get('notes', '')
        if not escalated_to:
            return Response({'detail': 'escalated_to required (distributor/principal name)'}, status=status.HTTP_400_BAD_REQUEST)

        EscalationLog.objects.create(
            ticket=ticket,
            escalation_type=EscalationLog.ESCALATION_EXTERNAL,
            from_user=user,
            to_external=escalated_to,
            notes=notes,
        )

        ticket.status = Ticket.STATUS_ESCALATED_EXTERNAL
        ticket.external_escalated_to = escalated_to
        ticket.external_escalation_notes = notes
        ticket.external_escalated_at = timezone.now()
        ticket.save()

        # System message
        sys_content = f"Ticket escalated externally to {escalated_to} by {user.get_full_name() or user.username}."
        if notes:
            sys_content += f" Notes: {notes}"
        for ch in ['client_employee', 'admin_employee']:
            Message.objects.create(
                ticket=ticket,
                channel_type=ch,
                sender=user,
                content=sys_content,
                is_system_message=True,
            )
            self._broadcast_system_message(ticket.id, ch, sys_content, user)

        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def close_ticket(self, request, pk=None):
        """Admin confirms closure. Requires resolution proof attachment and CSAT survey to be completed."""
        if request.user.role != User.ROLE_ADMIN:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        ticket = self.get_object()

        # Check resolution proof exists
        has_proof = ticket.attachments.filter(is_resolution_proof=True).exists()
        if not has_proof:
            return Response({'detail': 'Resolution proof attachment is required before closure.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check CSAT survey completed
        if not hasattr(ticket, 'csat_survey') or not CSATSurvey.objects.filter(ticket=ticket).exists():
            return Response({'detail': 'Client must complete CSAT survey before closure.'}, status=status.HTTP_400_BAD_REQUEST)

        # End current session
        if ticket.current_session:
            ticket.current_session.is_active = False
            ticket.current_session.ended_at = timezone.now()
            ticket.current_session.save()

        ticket.status = Ticket.STATUS_CLOSED
        ticket.time_out = timezone.now()
        ticket.save()

        # System message
        sys_content = f"Ticket closed by {request.user.get_full_name() or request.user.username}."
        for ch in ['client_employee', 'admin_employee']:
            Message.objects.create(
                ticket=ticket,
                channel_type=ch,
                sender=request.user,
                content=sys_content,
                is_system_message=True,
            )
            self._broadcast_system_message(ticket.id, ch, sys_content, request.user)

        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'], url_path='request_closure', permission_classes=[IsAuthenticated])
    def request_closure(self, request, pk=None):
        """Employee marks ticket as pending feedback — triggers client CSAT survey."""
        ticket = self.get_object()
        user = request.user
        if user.role != User.ROLE_EMPLOYEE or ticket.assigned_to != user:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)

        # Check resolution proof
        has_proof = ticket.attachments.filter(is_resolution_proof=True).exists()
        if not has_proof:
            return Response({'detail': 'You must upload resolution proof before requesting closure.'}, status=status.HTTP_400_BAD_REQUEST)

        ticket.status = Ticket.STATUS_PENDING_FEEDBACK
        ticket.save()

        sys_content = f"{user.get_full_name() or user.username} marked this ticket as resolved and requested client feedback."
        for ch in ['client_employee', 'admin_employee']:
            Message.objects.create(
                ticket=ticket,
                channel_type=ch,
                sender=user,
                content=sys_content,
                is_system_message=True,
            )
            self._broadcast_system_message(ticket.id, ch, sys_content, user)

        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'], url_path='upload_resolution_proof', permission_classes=[IsAuthenticated])
    def upload_resolution_proof(self, request, pk=None):
        """Upload file attachments marked as resolution proof."""
        ticket = self.get_object()
        user = request.user
        if user.role not in (User.ROLE_EMPLOYEE, User.ROLE_ADMIN):
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        if user.role == User.ROLE_EMPLOYEE and ticket.assigned_to != user:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        files = request.FILES.getlist('files')
        if not files:
            return Response({'detail': 'No files provided.'}, status=status.HTTP_400_BAD_REQUEST)
        attachments = []
        for f in files:
            att = TicketAttachment.objects.create(ticket=ticket, file=f, uploaded_by=user, is_resolution_proof=True)
            attachments.append(att)
        return Response(TicketAttachmentSerializer(attachments, many=True).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='update_task/(?P<task_id>[0-9]+)', permission_classes=[IsAuthenticated])
    def update_task(self, request, pk=None, task_id=None):
        """Update a task's status (todo, in_progress, done)."""
        ticket = self.get_object()
        user = request.user
        if user.role == User.ROLE_EMPLOYEE and ticket.assigned_to != user:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        if user.role == User.ROLE_CLIENT:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        try:
            task = TicketTask.objects.get(id=task_id, ticket=ticket)
        except TicketTask.DoesNotExist:
            return Response({'detail': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)
        new_status = request.data.get('status')
        if new_status and new_status in dict(TicketTask.STATUS_CHOICES):
            task.status = new_status
            task.save()
        return Response({'id': task.id, 'description': task.description, 'status': task.status})

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
        # only admins / superadmins manage templates
        if self.request.user.is_admin_level:
            return Template.objects.all()
        return Template.objects.none()

    def create(self, request, *args, **kwargs):
        if not request.user.is_admin_level:
            return Response({'detail': 'Admin only.'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not request.user.is_admin_level:
            return Response({'detail': 'Admin only.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not request.user.is_admin_level:
            return Response({'detail': 'Admin only.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class TypeOfServiceViewSet(viewsets.ModelViewSet):
    """CRUD for Type of Service (admin manages, all authenticated can list active)."""
    queryset = TypeOfService.objects.all().order_by('name')
    serializer_class = TypeOfServiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_admin_level:
            return TypeOfService.objects.all().order_by('name')
        # Non-admins only see active services (for dropdown)
        return TypeOfService.objects.filter(is_active=True).order_by('name')

    def create(self, request, *args, **kwargs):
        if not request.user.is_admin_level:
            return Response({'detail': 'Admin only.'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not request.user.is_admin_level:
            return Response({'detail': 'Admin only.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not request.user.is_admin_level:
            return Response({'detail': 'Admin only.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class CSATSurveyViewSet(viewsets.GenericViewSet):
    """Client submits CSAT survey for a ticket."""
    serializer_class = CSATSurveySerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='submit')
    def submit(self, request):
        """Client submits CSAT survey. Ticket must be in pending_feedback status."""
        ticket_id = request.data.get('ticket')
        if not ticket_id:
            return Response({'detail': 'ticket id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            ticket = Ticket.objects.get(id=ticket_id)
        except Ticket.DoesNotExist:
            return Response({'detail': 'Ticket not found'}, status=status.HTTP_404_NOT_FOUND)

        # Only the client who created the ticket can submit CSAT
        if request.user.role != User.ROLE_CLIENT or ticket.created_by != request.user:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)

        if ticket.status != Ticket.STATUS_PENDING_FEEDBACK:
            return Response({'detail': 'Ticket is not pending feedback.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if already submitted
        if CSATSurvey.objects.filter(ticket=ticket).exists():
            return Response({'detail': 'CSAT survey already submitted for this ticket.'}, status=status.HTTP_400_BAD_REQUEST)

        rating = request.data.get('rating')
        if not rating or int(rating) not in range(1, 6):
            return Response({'detail': 'Rating must be between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)

        survey = CSATSurvey.objects.create(
            ticket=ticket,
            rating=int(rating),
            comments=request.data.get('comments', ''),
            has_other_concerns=bool(request.data.get('has_other_concerns', False)),
            other_concerns_text=request.data.get('other_concerns_text', ''),
        )

        # Move ticket to pending_closure so admin can confirm close
        ticket.status = Ticket.STATUS_PENDING_CLOSURE
        ticket.save()

        return Response(CSATSurveySerializer(survey).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='for_ticket/(?P<ticket_id>[0-9]+)')
    def for_ticket(self, request, ticket_id=None):
        """Get CSAT survey for a specific ticket."""
        try:
            survey = CSATSurvey.objects.get(ticket_id=ticket_id)
            return Response(CSATSurveySerializer(survey).data)
        except CSATSurvey.DoesNotExist:
            return Response({'detail': 'No survey found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_employees(request):
    """Return list of employees (for assignment/pass pickers)."""
    if request.user.role not in (User.ROLE_ADMIN, User.ROLE_EMPLOYEE):
        return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
    employees = User.objects.filter(role=User.ROLE_EMPLOYEE).order_by('first_name', 'last_name')
    return Response(UserSerializer(employees, many=True).data)

