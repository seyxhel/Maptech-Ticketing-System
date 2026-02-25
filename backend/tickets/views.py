from rest_framework import viewsets, status
from django.db import IntegrityError
from django.db.models import Count, Avg, Q, F
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
from .models import Ticket, TicketTask, TypeOfService, TicketAttachment, AssignmentSession, Message, EscalationLog, CSATSurvey
from .serializers import (
    TicketSerializer, TypeOfServiceSerializer,
    TicketAttachmentSerializer, CSATSurveySerializer, EscalationLogSerializer,
    MessageSerializer, AssignmentSessionSerializer,
    ClientCreateTicketSerializer, AdminTicketActionSerializer,
    EmployeeTicketActionSerializer,
)
from .permissions import IsClient, IsAdminLevel, IsAssignedEmployee, IsAdminOrAssignedEmployee, IsTicketParticipant
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

    def get_serializer_class(self):
        """Return a role-specific serializer for the create action so the
        DRF browsable API shows different form fields per role."""
        if self.action == 'create':
            user = self.request.user
            if user.is_authenticated:
                if user.role == User.ROLE_CLIENT:
                    return ClientCreateTicketSerializer
                elif user.role == User.ROLE_EMPLOYEE:
                    return EmployeeTicketActionSerializer
                elif user.is_admin_level:
                    return AdminTicketActionSerializer
        return TicketSerializer

    def create(self, request, *args, **kwargs):
        """Role-aware POST: client creates a ticket, admin/employee act on existing tickets."""
        user = request.user
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # ── Client: create a new ticket (status auto-set to open) ──
        if user.role == User.ROLE_CLIENT:
            ticket = serializer.save(created_by=user)
            return Response(
                TicketSerializer(ticket, context={'request': request}).data,
                status=status.HTTP_201_CREATED,
            )

        # ── Admin: set priority and/or assign agent on existing ticket ──
        if user.is_admin_level:
            try:
                ticket = Ticket.objects.get(id=serializer.validated_data['ticket'])
            except Ticket.DoesNotExist:
                return Response({'detail': 'Ticket not found.'}, status=status.HTTP_404_NOT_FOUND)

            priority = serializer.validated_data.get('priority')
            if priority:
                ticket.priority = priority

            assign_agent = serializer.validated_data.get('assign_agent')
            if assign_agent:
                try:
                    emp = User.objects.get(id=assign_agent, role=User.ROLE_EMPLOYEE)
                except User.DoesNotExist:
                    return Response({'detail': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)

                old_employee = ticket.assigned_to
                if ticket.current_session:
                    prev = ticket.current_session
                    prev.is_active = False
                    prev.ended_at = timezone.now()
                    prev.save()
                    if old_employee and old_employee.id != emp.id:
                        self._send_force_disconnect(ticket.id, old_employee)

                new_session = AssignmentSession.objects.create(ticket=ticket, employee=emp)
                ticket.assigned_to = emp
                ticket.current_session = new_session
                if ticket.status == Ticket.STATUS_OPEN:
                    ticket.status = Ticket.STATUS_OPEN  # keep open

                if old_employee and old_employee.id != emp.id:
                    sys_content = f"Employee changed from {old_employee.get_full_name() or old_employee.username} to {emp.get_full_name() or emp.username}"
                    for ch in ['client_employee', 'admin_employee']:
                        Message.objects.create(
                            ticket=ticket, assignment_session=new_session,
                            channel_type=ch, sender=user,
                            content=sys_content, is_system_message=True,
                        )
                        self._broadcast_system_message(ticket.id, ch, sys_content, user)

            ticket.save()
            return Response(TicketSerializer(ticket, context={'request': request}).data)

        # ── Employee: update product/service fields on existing ticket ──
        if user.role == User.ROLE_EMPLOYEE:
            try:
                ticket = Ticket.objects.get(id=serializer.validated_data['ticket'])
            except Ticket.DoesNotExist:
                return Response({'detail': 'Ticket not found.'}, status=status.HTTP_404_NOT_FOUND)

            if ticket.assigned_to != user:
                return Response({'detail': 'You are not assigned to this ticket.'}, status=status.HTTP_403_FORBIDDEN)

            employee_fields = [
                'has_warranty', 'product', 'brand', 'model_name',
                'device_equipment', 'version_no', 'date_purchased', 'serial_no',
                'action_taken', 'remarks', 'job_status',
            ]
            for field in employee_fields:
                val = serializer.validated_data.get(field)
                if val not in (None, ''):
                    setattr(ticket, field, val)

            if ticket.status == Ticket.STATUS_OPEN:
                ticket.status = Ticket.STATUS_IN_PROGRESS
            ticket.save()
            return Response(TicketSerializer(ticket, context={'request': request}).data)

        return Response({'detail': 'Your role cannot perform this action.'}, status=status.HTTP_403_FORBIDDEN)

    def get_permissions(self):
        """Return role-based permissions for each action."""
        perm_map = {
            # Standard CRUD
            'create':                   [IsAuthenticated()],
            'update':                   [IsAuthenticated(), IsTicketParticipant()],
            'partial_update':           [IsAuthenticated(), IsTicketParticipant()],
            'destroy':                  [IsAuthenticated(), IsAdminLevel()],
            # Admin-only lifecycle actions
            'assign':                   [IsAuthenticated(), IsAdminLevel()],
            'review':                   [IsAuthenticated(), IsAdminLevel()],
            'confirm_ticket':           [IsAuthenticated(), IsAdminLevel()],
            'close_ticket':             [IsAuthenticated(), IsAdminLevel()],
            # Assigned-employee actions
            'escalate':                 [IsAuthenticated(), IsAssignedEmployee()],
            'pass_ticket':              [IsAuthenticated(), IsAssignedEmployee()],
            'update_employee_fields':   [IsAuthenticated(), IsAssignedEmployee()],
            'request_closure':          [IsAuthenticated(), IsAssignedEmployee()],
            # Admin or assigned employee
            'escalate_external':        [IsAuthenticated(), IsAdminOrAssignedEmployee()],
            'upload_resolution_proof':  [IsAuthenticated(), IsAdminOrAssignedEmployee()],
            'update_task':              [IsAuthenticated(), IsAdminOrAssignedEmployee()],
            # Any ticket participant (creator, assignee, admin)
            'upload_attachment':        [IsAuthenticated(), IsTicketParticipant()],
            'delete_attachment':        [IsAuthenticated(), IsTicketParticipant()],
        }
        return perm_map.get(self.action, [IsAuthenticated()])

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        ticket = self.get_object()
        employee_id = request.data.get('employee_id')
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

    @action(detail=True, methods=['post'])
    def escalate(self, request, pk=None):
        """Employee escalates ticket internally — logs escalation, keeps ticket for supervisor to reassign."""
        ticket = self.get_object()
        user = request.user
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

    @action(detail=True, methods=['post'])
    def pass_ticket(self, request, pk=None):
        """Employee passes ticket to another employee — full session management."""
        ticket = self.get_object()
        user = request.user
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

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """Admin/Superadmin reviews a ticket — populates time_in and optionally sets priority."""
        ticket = self.get_object()
        if not ticket.time_in:
            ticket.time_in = timezone.now()
        priority = request.data.get('priority')
        if priority and priority in dict(Ticket.PRIORITY_CHOICES):
            ticket.priority = priority
        ticket.save()
        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['patch'])
    def update_employee_fields(self, request, pk=None):
        """Employee updates their specific fields on a ticket."""
        ticket = self.get_object()
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

    @action(detail=True, methods=['post'])
    def confirm_ticket(self, request, pk=None):
        """Admin/Superadmin confirms they've contacted the client and verified the issue."""
        ticket = self.get_object()
        ticket.confirmed_by_admin = True
        ticket.save()
        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'])
    def escalate_external(self, request, pk=None):
        """Admin or assigned employee escalates to distributor/principal (external).
        Once externally escalated, the ticket cannot bounce back — resolution must occur externally."""
        user = request.user
        ticket = self.get_object()

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

    @action(detail=True, methods=['post'])
    def close_ticket(self, request, pk=None):
        """Admin/Superadmin confirms closure. Requires resolution proof and CSAT survey."""
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

    @action(detail=True, methods=['post'], url_path='request_closure')
    def request_closure(self, request, pk=None):
        """Employee marks ticket as pending feedback — triggers client CSAT survey."""
        ticket = self.get_object()
        user = request.user

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

    @action(detail=True, methods=['post'], url_path='upload_resolution_proof')
    def upload_resolution_proof(self, request, pk=None):
        """Upload file attachments marked as resolution proof."""
        ticket = self.get_object()
        user = request.user
        files = request.FILES.getlist('files')
        if not files:
            return Response({'detail': 'No files provided.'}, status=status.HTTP_400_BAD_REQUEST)
        attachments = []
        for f in files:
            att = TicketAttachment.objects.create(ticket=ticket, file=f, uploaded_by=user, is_resolution_proof=True)
            attachments.append(att)
        return Response(TicketAttachmentSerializer(attachments, many=True).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='update_task/(?P<task_id>[0-9]+)')
    def update_task(self, request, pk=None, task_id=None):
        """Update a task's status (todo, in_progress, done)."""
        ticket = self.get_object()
        try:
            task = TicketTask.objects.get(id=task_id, ticket=ticket)
        except TicketTask.DoesNotExist:
            return Response({'detail': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)
        new_status = request.data.get('status')
        if new_status and new_status in dict(TicketTask.STATUS_CHOICES):
            task.status = new_status
            task.save()
        return Response({'id': task.id, 'description': task.description, 'status': task.status})

    @action(detail=True, methods=['post'], url_path='upload_attachment')
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

    @action(detail=True, methods=['delete'], url_path='delete_attachment/(?P<att_id>[0-9]+)')
    def delete_attachment(self, request, pk=None, att_id=None):
        """Delete a file attachment from a ticket (only uploader or admin)."""
        ticket = self.get_object()
        try:
            att = TicketAttachment.objects.get(id=att_id, ticket=ticket)
        except TicketAttachment.DoesNotExist:
            return Response({'detail': 'Attachment not found.'}, status=status.HTTP_404_NOT_FOUND)
        # Only the uploader or an admin can delete
        if not request.user.is_admin_level and att.uploaded_by != request.user:
            return Response({'detail': 'You can only delete your own attachments.'}, status=status.HTTP_403_FORBIDDEN)
        att.file.delete(save=False)
        att.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── Dashboard stats ───────────────────────────────────────────────────
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Dashboard statistics scoped to user role."""
        qs = self.get_queryset()
        by_status = dict(qs.values_list('status').annotate(c=Count('id')).values_list('status', 'c'))
        by_priority = dict(qs.exclude(priority='').values_list('priority').annotate(c=Count('id')).values_list('priority', 'c'))
        total = qs.count()
        open_count = by_status.get(Ticket.STATUS_OPEN, 0)
        in_progress = by_status.get(Ticket.STATUS_IN_PROGRESS, 0)
        closed = by_status.get(Ticket.STATUS_CLOSED, 0)
        escalated = by_status.get(Ticket.STATUS_ESCALATED, 0) + by_status.get(Ticket.STATUS_ESCALATED_EXTERNAL, 0)
        pending = by_status.get(Ticket.STATUS_PENDING_CLOSURE, 0) + by_status.get(Ticket.STATUS_PENDING_FEEDBACK, 0)

        # Average resolution time (closed tickets that have time_in and time_out)
        closed_with_times = qs.filter(status=Ticket.STATUS_CLOSED, time_in__isnull=False, time_out__isnull=False)
        avg_resolution = None
        if closed_with_times.exists():
            from django.db.models import ExpressionWrapper, DurationField
            durations = closed_with_times.annotate(
                duration=ExpressionWrapper(F('time_out') - F('time_in'), output_field=DurationField())
            ).aggregate(avg=Avg('duration'))
            if durations['avg']:
                avg_resolution = durations['avg'].total_seconds() / 3600  # hours

        return Response({
            'total': total,
            'by_status': by_status,
            'by_priority': by_priority,
            'open': open_count,
            'in_progress': in_progress,
            'closed': closed,
            'escalated': escalated,
            'pending': pending,
            'avg_resolution_hours': avg_resolution,
        })

    # ── REST message history ────────────────────────────────────────────
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Return message history for the ticket (scoped by channel_type param).
        Admins/employees see all messages; clients see only client_employee channel."""
        ticket = self.get_object()
        user = request.user

        # Verify participant
        if not (user.is_admin_level or ticket.assigned_to == user or ticket.created_by == user):
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)

        qs = Message.objects.filter(ticket=ticket).order_by('created_at')

        # Clients can only see client_employee channel
        channel = request.query_params.get('channel')
        if user.role == User.ROLE_CLIENT:
            qs = qs.filter(channel_type='client_employee')
        elif channel in ('client_employee', 'admin_employee'):
            qs = qs.filter(channel_type=channel)

        # Optional: scope to current session only
        session_only = request.query_params.get('current_session', '').lower() in ('1', 'true')
        if session_only and ticket.current_session:
            qs = qs.filter(assignment_session=ticket.current_session)

        return Response(MessageSerializer(qs, many=True).data)

    # ── Assignment session history ────────────────────────────────────
    @action(detail=True, methods=['get'], url_path='assignment_history')
    def assignment_history(self, request, pk=None):
        """Return all assignment sessions for this ticket (admin/employee only)."""
        ticket = self.get_object()
        user = request.user
        if not (user.is_admin_level or ticket.assigned_to == user):
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        sessions = AssignmentSession.objects.filter(ticket=ticket).order_by('-started_at')
        return Response(AssignmentSessionSerializer(sessions, many=True).data)





class TypeOfServiceViewSet(viewsets.ModelViewSet):
    """CRUD for Type of Service (admin manages, all authenticated can list active)."""
    queryset = TypeOfService.objects.all().order_by('name')
    serializer_class = TypeOfServiceSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]  # all roles need the dropdown
        return [IsAuthenticated(), IsAdminLevel()]

    def get_queryset(self):
        if self.request.user.is_admin_level:
            return TypeOfService.objects.all().order_by('name')
        return TypeOfService.objects.filter(is_active=True).order_by('name')


class CSATSurveyViewSet(viewsets.GenericViewSet):
    """Client submits CSAT survey for a ticket."""
    serializer_class = CSATSurveySerializer

    def get_permissions(self):
        if self.action == 'submit':
            return [IsAuthenticated(), IsClient()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'], url_path='list')
    def list_surveys(self, request):
        """Admin lists all CSAT surveys."""
        if not request.user.is_admin_level:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        surveys = CSATSurvey.objects.select_related('ticket').all().order_by('-created_at')
        return Response(CSATSurveySerializer(surveys, many=True).data)

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

        # Only the client who created the ticket can submit
        if ticket.created_by != request.user:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)

        if ticket.status != Ticket.STATUS_PENDING_FEEDBACK:
            return Response({'detail': 'Ticket is not pending feedback.'}, status=status.HTTP_400_BAD_REQUEST)

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

        ticket.status = Ticket.STATUS_PENDING_CLOSURE
        ticket.save()

        return Response(CSATSurveySerializer(survey).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='for_ticket/(?P<ticket_id>[0-9]+)')
    def for_ticket(self, request, ticket_id=None):
        """Get CSAT survey for a specific ticket (only participants)."""
        try:
            ticket = Ticket.objects.get(id=ticket_id)
        except Ticket.DoesNotExist:
            return Response({'detail': 'Ticket not found.'}, status=status.HTTP_404_NOT_FOUND)
        # Only admin, assigned employee, or ticket creator can view
        user = request.user
        if not (user.is_admin_level or ticket.assigned_to == user or ticket.created_by == user):
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        try:
            survey = CSATSurvey.objects.get(ticket=ticket)
            return Response(CSATSurveySerializer(survey).data)
        except CSATSurvey.DoesNotExist:
            return Response({'detail': 'No survey found.'}, status=status.HTTP_404_NOT_FOUND)


class EscalationLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only viewset for escalation logs (admin sees all, employee sees own)."""
    serializer_class = EscalationLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin_level:
            return EscalationLog.objects.all().order_by('-created_at')
        if user.role == User.ROLE_EMPLOYEE:
            return EscalationLog.objects.filter(
                Q(from_user=user) | Q(to_user=user)
            ).order_by('-created_at')
        return EscalationLog.objects.none()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_employees(request):
    """Return list of employees (for assignment/pass pickers)."""
    if not (request.user.is_admin_level or request.user.role == User.ROLE_EMPLOYEE):
        return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
    employees = User.objects.filter(role=User.ROLE_EMPLOYEE).order_by('first_name', 'last_name')
    return Response(UserSerializer(employees, many=True).data)

