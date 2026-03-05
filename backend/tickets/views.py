from rest_framework import viewsets, status
from django.db.models import Count, Avg, Q, F
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.contrib.auth import get_user_model
User = get_user_model()
from django.utils import timezone
from .models import (
    Ticket, TicketTask, TypeOfService, TicketAttachment,
    AssignmentSession, Message, EscalationLog, AuditLog,
    Product, Client, CallLog, CSATFeedback, Notification, Category,
)
from .serializers import (
    TicketSerializer, TypeOfServiceSerializer,
    TicketAttachmentSerializer, EscalationLogSerializer,
    MessageSerializer, AssignmentSessionSerializer,
    AdminCreateTicketSerializer,
    EmployeeTicketActionSerializer,
    AuditLogSerializer,
    KnowledgeHubAttachmentSerializer,
    PublishedArticleSerializer,
    ProductSerializer, ClientSerializer,
    CallLogSerializer, CSATFeedbackSerializer,
    NotificationSerializer, CategorySerializer,
)
from .permissions import IsAdminLevel, IsAssignedEmployee, IsAdminOrAssignedEmployee, IsTicketParticipant, IsSuperAdmin
from users.serializers import UserSerializer


def _get_client_ip(request):
    """Extract the client IP address from the request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all().order_by('-created_at')
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]
    swagger_tags = ['Tickets']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Ticket.objects.none()
        user = self.request.user
        if user.is_admin_level:
            return Ticket.objects.all().order_by('-created_at')
        if user.role == User.ROLE_EMPLOYEE:
            return Ticket.objects.filter(assigned_to=user).order_by('-created_at')
        return Ticket.objects.none()

    def _audit_ticket(self, request, ticket, action, activity, changes=None):
        """Shortcut to create an AuditLog entry for a ticket action."""
        AuditLog.log(
            entity=AuditLog.ENTITY_TICKET,
            entity_id=ticket.id,
            action=action,
            activity=activity,
            actor=request.user,
            ip_address=_get_client_ip(request),
            changes=changes,
        )

    def get_serializer_class(self):
        """Return a role-specific serializer for the create action so the
        DRF browsable API shows different form fields per role."""
        if getattr(self, 'swagger_fake_view', False):
            return TicketSerializer
        if self.action == 'create':
            user = self.request.user
            if user.is_authenticated:
                if user.is_admin_level:
                    return AdminCreateTicketSerializer
                elif user.role == User.ROLE_EMPLOYEE:
                    return EmployeeTicketActionSerializer
        return TicketSerializer

    def create(self, request, *args, **kwargs):
        """Role-aware POST: admin creates a ticket, employee acts on existing tickets."""
        user = request.user
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # ── Admin: create a new ticket ──
        if user.is_admin_level:
            priority = serializer.validated_data.pop('priority', '') or request.data.get('priority', '')
            assign_to_id = serializer.validated_data.pop('assign_to', None) or request.data.get('assign_to')
            is_existing = serializer.validated_data.pop('is_existing_client', False)

            ticket = serializer.save(created_by=user)

            # If existing client, pre-fill client info from the Client record
            if is_existing and ticket.client_record:
                cr = ticket.client_record
                ticket.client = cr.client_name
                ticket.contact_person = cr.contact_person
                ticket.landline = cr.landline
                ticket.mobile_no = cr.mobile_no
                ticket.designation = cr.designation
                ticket.department_organization = cr.department_organization
                ticket.email_address = cr.email_address
                ticket.address = cr.address

            if priority and priority in dict(Ticket.PRIORITY_CHOICES):
                ticket.priority = priority

            if assign_to_id:
                try:
                    emp = User.objects.get(id=assign_to_id, role=User.ROLE_EMPLOYEE)
                    new_session = AssignmentSession.objects.create(ticket=ticket, employee=emp)
                    ticket.assigned_to = emp
                    ticket.current_session = new_session
                except User.DoesNotExist:
                    pass

            ticket.confirmed_by_admin = True
            ticket.save()

            self._audit_ticket(request, ticket, AuditLog.ACTION_CREATE,
                               f"{user.email} created ticket {ticket.stf_no}")

            return Response(
                TicketSerializer(ticket, context={'request': request}).data,
                status=status.HTTP_201_CREATED,
            )

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
            'save_product_details':     [IsAuthenticated(), IsAssignedEmployee()],
            'request_closure':          [IsAuthenticated(), IsAssignedEmployee()],
            # Admin or assigned employee
            'escalate_external':        [IsAuthenticated(), IsAssignedEmployee()],
            'upload_resolution_proof':  [IsAuthenticated(), IsAdminOrAssignedEmployee()],
            'update_task':              [IsAuthenticated(), IsAdminOrAssignedEmployee()],
            # Employee starts working
            'start_work':               [IsAuthenticated(), IsAssignedEmployee()],
            # Delete attachment (resolution proofs)
            'delete_attachment':        [IsAuthenticated(), IsTicketParticipant()],
        }
        return perm_map.get(self.action, [IsAuthenticated()])

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        ticket = self.get_object()

        # Block reassignment once the employee has started work
        if ticket.status != Ticket.STATUS_OPEN:
            return Response(
                {'detail': 'Cannot reassign a ticket after the employee has started working on it.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

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
            for ch in ['admin_employee']:
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

        self._audit_ticket(request, ticket, AuditLog.ACTION_ASSIGN,
                           f"{request.user.email} assigned ticket {ticket.stf_no} to {emp.email}",
                           changes={'assigned_to': emp.id, 'employee_email': emp.email})

        return Response(self.get_serializer(ticket).data)

    @staticmethod
    def _send_force_disconnect(ticket_id, old_employee):
        """Send force_disconnect to old employee's WebSocket channels."""
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        if channel_layer:
            for ch in ['admin_employee']:
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
        for ch in ['admin_employee']:
            Message.objects.create(
                ticket=ticket,
                channel_type=ch,
                sender=user,
                content=sys_content,
                is_system_message=True,
            )
            self._broadcast_system_message(ticket.id, ch, sys_content, user)

        self._audit_ticket(request, ticket, AuditLog.ACTION_ESCALATE,
                           f"{user.email} escalated ticket {ticket.stf_no} internally",
                           changes={'escalation_type': 'internal', 'notes': notes})

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
        for ch in ['admin_employee']:
            Message.objects.create(
                ticket=ticket,
                assignment_session=new_session,
                channel_type=ch,
                sender=user,
                content=sys_content,
                is_system_message=True,
            )
            self._broadcast_system_message(ticket.id, ch, sys_content, user)

        self._audit_ticket(request, ticket, AuditLog.ACTION_PASS,
                           f"{user.email} passed ticket {ticket.stf_no} to {to_emp.email}",
                           changes={'from_employee': user.id, 'to_employee': to_emp.id, 'notes': notes})

        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """Admin/Superadmin reviews a ticket — optionally sets priority."""
        ticket = self.get_object()
        priority = request.data.get('priority')
        if priority and priority in dict(Ticket.PRIORITY_CHOICES):
            ticket.priority = priority
        ticket.save()

        self._audit_ticket(request, ticket, AuditLog.ACTION_REVIEW,
                           f"{request.user.email} reviewed ticket {ticket.stf_no}",
                           changes={'priority': ticket.priority})

        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['patch'])
    def save_product_details(self, request, pk=None):
        """Employee saves product detail fields without changing ticket status."""
        ticket = self.get_object()
        allowed = [
            'has_warranty', 'product', 'brand', 'model_name',
            'device_equipment', 'version_no',
            'date_purchased', 'serial_no',
        ]
        changes = {}
        for field in allowed:
            if field in request.data:
                setattr(ticket, field, request.data[field])
                changes[field] = request.data[field]

        ticket.save()

        self._audit_ticket(request, ticket, AuditLog.ACTION_UPDATE,
                           f"{request.user.email} updated product details on ticket {ticket.stf_no}",
                           changes=changes)

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
            'cascade_type', 'observation', 'signature', 'signed_by_name',
        ]
        for field in allowed:
            if field in request.data:
                setattr(ticket, field, request.data[field])

        # Set status to pending_closure (Resolved) when employee clicks Resolve
        old_status = ticket.status

        # Time Out: set when employee resolves the ticket
        ticket.status = Ticket.STATUS_PENDING_CLOSURE
        if not ticket.time_out:
            ticket.time_out = timezone.now()

        ticket.save()

        action_type = AuditLog.ACTION_RESOLVE if ticket.status == Ticket.STATUS_PENDING_CLOSURE else AuditLog.ACTION_UPDATE
        self._audit_ticket(request, ticket, action_type,
                           f"{request.user.email} updated fields on ticket {ticket.stf_no} (status: {old_status} → {ticket.status})",
                           changes={f: request.data[f] for f in allowed if f in request.data})

        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'])
    def confirm_ticket(self, request, pk=None):
        """Admin/Superadmin confirms they've contacted the client and verified the issue."""
        ticket = self.get_object()
        ticket.confirmed_by_admin = True
        ticket.save()

        self._audit_ticket(request, ticket, AuditLog.ACTION_CONFIRM,
                           f"{request.user.email} confirmed ticket {ticket.stf_no}")

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
        for ch in ['admin_employee']:
            Message.objects.create(
                ticket=ticket,
                channel_type=ch,
                sender=user,
                content=sys_content,
                is_system_message=True,
            )
            self._broadcast_system_message(ticket.id, ch, sys_content, user)

        self._audit_ticket(request, ticket, AuditLog.ACTION_ESCALATE,
                           f"{user.email} escalated ticket {ticket.stf_no} externally to {escalated_to}",
                           changes={'escalation_type': 'external', 'escalated_to': escalated_to, 'notes': notes})

        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'])
    def close_ticket(self, request, pk=None):
        """Admin/Superadmin closes the ticket immediately."""
        ticket = self.get_object()

        # Require CSAT feedback before closing
        if not hasattr(ticket, 'csat_feedback') or not ticket.csat_feedback:
            # Allow closing without CSAT if no employee is assigned
            if ticket.assigned_to:
                return Response(
                    {'detail': 'Please submit CSAT feedback for the employee before closing this ticket.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # End current session
        if ticket.current_session:
            ticket.current_session.is_active = False
            ticket.current_session.ended_at = timezone.now()
            ticket.current_session.save()

        ticket.status = Ticket.STATUS_CLOSED
        if not ticket.time_out:
            ticket.time_out = timezone.now()
        ticket.save()

        # System message
        sys_content = f"Ticket closed by {request.user.get_full_name() or request.user.username}."
        if ticket.current_session:
            for ch in ['admin_employee']:
                Message.objects.create(
                    ticket=ticket,
                    assignment_session=ticket.current_session,
                    channel_type=ch,
                    sender=request.user,
                    content=sys_content,
                    is_system_message=True,
                )
                self._broadcast_system_message(ticket.id, ch, sys_content, request.user)

        self._audit_ticket(request, ticket, AuditLog.ACTION_CLOSE,
                           f"{request.user.email} closed ticket {ticket.stf_no}")

        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'], url_path='request_closure')
    def request_closure(self, request, pk=None):
        """Employee marks ticket as pending closure."""
        ticket = self.get_object()
        user = request.user

        # Check resolution proof
        has_proof = ticket.attachments.filter(is_resolution_proof=True).exists()
        if not has_proof:
            return Response({'detail': 'You must upload resolution proof before requesting closure.'}, status=status.HTTP_400_BAD_REQUEST)

        ticket.status = Ticket.STATUS_PENDING_CLOSURE
        ticket.save()

        sys_content = f"{user.get_full_name() or user.username} marked this ticket as resolved and requested closure."
        for ch in ['admin_employee']:
            Message.objects.create(
                ticket=ticket,
                channel_type=ch,
                sender=user,
                content=sys_content,
                is_system_message=True,
            )
            self._broadcast_system_message(ticket.id, ch, sys_content, user)

        self._audit_ticket(request, ticket, AuditLog.ACTION_RESOLVE,
                           f"{user.email} requested closure for ticket {ticket.stf_no}")

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

        self._audit_ticket(request, ticket, AuditLog.ACTION_UPLOAD,
                           f"{user.email} uploaded {len(files)} resolution proof file(s) on ticket {ticket.stf_no}",
                           changes={'file_count': len(files), 'file_names': [f.name for f in files]})

        return Response(TicketAttachmentSerializer(attachments, many=True, context={'request': request}).data, status=status.HTTP_201_CREATED)

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
        file_name = att.file.name if att.file else 'unknown'
        att.file.delete(save=False)
        att.delete()

        self._audit_ticket(request, ticket, AuditLog.ACTION_DELETE,
                           f"{request.user.email} deleted attachment '{file_name}' from ticket {ticket.stf_no}",
                           changes={'attachment_id': int(att_id), 'file_name': file_name})

        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── Dashboard stats ───────────────────────────────────────────────────
    @action(detail=True, methods=['post'])
    def start_work(self, request, pk=None):
        """Employee marks they are starting work on a ticket.
        Sets time_in and status to in_progress."""
        ticket = self.get_object()
        if not ticket.time_in:
            ticket.time_in = timezone.now()
        if ticket.status == Ticket.STATUS_OPEN:
            ticket.status = Ticket.STATUS_IN_PROGRESS
        ticket.save()

        self._audit_ticket(request, ticket, AuditLog.ACTION_UPDATE,
                           f"{request.user.email} started working on ticket {ticket.stf_no}",
                           changes={'time_in': str(ticket.time_in), 'status': ticket.status})

        return Response(self.get_serializer(ticket).data)

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
        pending = by_status.get(Ticket.STATUS_PENDING_CLOSURE, 0)

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
        Employees see only messages from their current assignment session.
        Admins see all messages across all sessions."""
        ticket = self.get_object()
        user = request.user

        # Verify participant
        if not (user.is_admin_level or ticket.assigned_to == user):
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)

        qs = Message.objects.filter(ticket=ticket).order_by('created_at')

        # Filter by channel if specified
        channel = request.query_params.get('channel')
        if channel in ('admin_employee',):
            qs = qs.filter(channel_type=channel)

        # Employees only see messages from their current assignment session
        if getattr(user, 'role', None) == User.ROLE_EMPLOYEE:
            if ticket.current_session:
                qs = qs.filter(assignment_session=ticket.current_session)
            else:
                qs = qs.none()

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
    swagger_tags = ['Type of Service']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]  # all roles need the dropdown
        return [IsAuthenticated(), IsAdminLevel()]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return TypeOfService.objects.none()
        if self.request.user.is_admin_level:
            return TypeOfService.objects.all().order_by('name')
        return TypeOfService.objects.filter(is_active=True).order_by('name')


class EscalationLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only viewset for escalation logs (admin sees all, employee sees own)."""
    serializer_class = EscalationLogSerializer
    permission_classes = [IsAuthenticated]
    swagger_tags = ['Escalation Logs']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return EscalationLog.objects.none()
        user = self.request.user
        if user.is_admin_level:
            return EscalationLog.objects.all().order_by('-created_at')
        if user.role == User.ROLE_EMPLOYEE:
            return EscalationLog.objects.filter(
                Q(from_user=user) | Q(to_user=user)
            ).order_by('-created_at')
        return EscalationLog.objects.none()


from drf_yasg.utils import swagger_auto_schema


@swagger_auto_schema(method='get', tags=['Employees'])
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_employees(request):
    """Return list of employees with their active ticket counts (for SLA-based assignment)."""
    if not (request.user.is_admin_level or request.user.role == User.ROLE_EMPLOYEE):
        return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
    employees = User.objects.filter(role=User.ROLE_EMPLOYEE).annotate(
        active_ticket_count=Count(
            'assigned_tickets',
            filter=Q(assigned_tickets__status__in=[
                Ticket.STATUS_OPEN, Ticket.STATUS_IN_PROGRESS, Ticket.STATUS_ESCALATED,
            ])
        )
    ).order_by('active_ticket_count', 'first_name', 'last_name')
    data = UserSerializer(employees, many=True).data
    # Attach ticket counts
    emp_counts = {e.id: e.active_ticket_count for e in employees}
    for d in data:
        d['active_ticket_count'] = emp_counts.get(d['id'], 0)
    return Response(data)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only viewset for audit logs.
    - Superadmin sees audit logs of both admin and employee actors.
    - Admin sees audit logs of employee actors only.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminLevel]
    swagger_tags = ['Audit Logs']

    def _role_filtered_qs(self):
        """Return base queryset filtered by the requesting user's role."""
        qs = AuditLog.objects.all().order_by('-timestamp')
        user = self.request.user
        if user.role == User.ROLE_SUPERADMIN:
            # Superadmin sees admin + employee logs (exclude superadmin's own & system)
            qs = qs.filter(
                Q(actor__role__in=[User.ROLE_ADMIN, User.ROLE_EMPLOYEE]) |
                Q(actor__isnull=True)  # system-generated logs
            )
        elif user.role == User.ROLE_ADMIN:
            # Admin sees only employee logs
            qs = qs.filter(actor__role=User.ROLE_EMPLOYEE)
        else:
            qs = qs.none()
        return qs

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return AuditLog.objects.none()
        qs = self._role_filtered_qs()

        # Filter by entity type
        entity = self.request.query_params.get('entity')
        if entity:
            qs = qs.filter(entity=entity)

        # Filter by action type
        action_filter = self.request.query_params.get('action')
        if action_filter:
            qs = qs.filter(action=action_filter)

        # Filter by actor email
        actor_email = self.request.query_params.get('actor_email')
        if actor_email:
            qs = qs.filter(actor_email__icontains=actor_email)

        # Search across activity text
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(activity__icontains=search) |
                Q(actor_email__icontains=search) |
                Q(entity__icontains=search)
            )

        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(timestamp__date__gte=date_from)
        if date_to:
            qs = qs.filter(timestamp__date__lte=date_to)

        return qs

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Return audit log summary stats for dashboard cards."""
        qs = self._role_filtered_qs()
        total = qs.count()
        by_entity = dict(qs.values_list('entity').annotate(c=Count('id')).values_list('entity', 'c'))
        by_action = dict(qs.values_list('action').annotate(c=Count('id')).values_list('action', 'c'))

        # Recent 24h count
        last_24h = qs.filter(timestamp__gte=timezone.now() - timezone.timedelta(hours=24)).count()

        return Response({
            'total': total,
            'last_24h': last_24h,
            'by_entity': by_entity,
            'by_action': by_action,
        })

    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export audit logs as CSV."""
        import csv, json
        from django.http import HttpResponse as DjangoHttpResponse

        qs = self.get_queryset().select_related('actor')
        response = DjangoHttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="audit_logs_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'

        writer = csv.writer(response)
        writer.writerow(['Timestamp', 'Entity', 'Entity ID', 'Activity', 'Action', 'Actor Name', 'Actor Email', 'IP Address', 'Changes'])
        for log in qs[:5000]:  # Limit export to 5000 rows
            # Resolve actor name the same way the serializer does
            actor_name = ''
            if log.actor:
                full = log.actor.get_full_name()
                actor_name = full if full.strip() else log.actor.username
            else:
                actor_name = log.actor_email or 'System'

            writer.writerow([
                log.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                log.entity,
                log.entity_id or '',
                log.activity,
                log.action,
                actor_name,
                log.actor_email,
                log.ip_address or '',
                json.dumps(log.changes) if log.changes else '',
            ])

        return response


# ────────────────────────────────────────────
# Knowledge Hub – Admin CRUD + Employee published view
# ────────────────────────────────────────────

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

        # Only proof attachments by default; pass ?all=true to see everything
        show_all = self.request.query_params.get('all', '').lower() in ('true', '1')
        if not show_all:
            qs = qs.filter(is_resolution_proof=True)

        # Filter by published status
        pub = self.request.query_params.get('published')
        if pub is not None and pub != '':
            qs = qs.filter(is_published=pub.lower() in ('true', '1'))

        # Filter by archived status
        archived = self.request.query_params.get('archived')
        if archived is not None and archived != '':
            qs = qs.filter(is_archived=archived.lower() in ('true', '1'))

        # Filter by ticket STF number
        stf = self.request.query_params.get('stf_no')
        if stf:
            qs = qs.filter(ticket__stf_no__icontains=stf)

        # Filter by ticket status
        ticket_status = self.request.query_params.get('ticket_status')
        if ticket_status:
            qs = qs.filter(ticket__status=ticket_status)

        # Search across multiple fields
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


# ────────────────────────────────────────────
# Product CRUD ViewSet
# ────────────────────────────────────────────

class CategoryViewSet(viewsets.ModelViewSet):
    """CRUD for product categories. Admin manages, all authenticated can list."""
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    swagger_tags = ['Categories']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminLevel()]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Category.objects.none()
        qs = Category.objects.all().order_by('name')
        if not self.request.user.is_admin_level:
            qs = qs.filter(is_active=True)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        return qs


class ProductViewSet(viewsets.ModelViewSet):
    """CRUD for global Product catalog. Admin manages, all authenticated can list."""
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    swagger_tags = ['Products']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminLevel()]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Product.objects.none()
        qs = Product.objects.all().order_by('-created_at')
        if not self.request.user.is_admin_level:
            qs = qs.filter(is_active=True)

        # Search
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(product_name__icontains=search) |
                Q(brand__icontains=search) |
                Q(model_name__icontains=search) |
                Q(serial_no__icontains=search) |
                Q(device_equipment__icontains=search) |
                Q(sales_no__icontains=search)
            )
        return qs


# ────────────────────────────────────────────
# Client CRUD ViewSet
# ────────────────────────────────────────────

class ClientViewSet(viewsets.ModelViewSet):
    """CRUD for Client master data. Admin manages, all authenticated can list."""
    queryset = Client.objects.all().order_by('client_name')
    serializer_class = ClientSerializer
    swagger_tags = ['Clients']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminLevel()]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Client.objects.none()
        qs = Client.objects.all().order_by('client_name')
        if not self.request.user.is_admin_level:
            qs = qs.filter(is_active=True)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(client_name__icontains=search) |
                Q(contact_person__icontains=search) |
                Q(email_address__icontains=search) |
                Q(department_organization__icontains=search)
            )
        return qs

    @action(detail=True, methods=['get'])
    def tickets(self, request, pk=None):
        """Return all tickets linked to this client."""
        client = self.get_object()
        tickets = Ticket.objects.filter(
            Q(client_record=client) | Q(client__iexact=client.client_name)
        ).order_by('-created_at')
        return Response(TicketSerializer(tickets, many=True, context={'request': request}).data)


# ────────────────────────────────────────────
# Call Log ViewSet
# ────────────────────────────────────────────

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

        # Filter by ticket
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


# ────────────────────────────────────────────
# CSAT Feedback ViewSet
# ────────────────────────────────────────────

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


# ────────────────────────────────────────────
# Notification ViewSet
# ────────────────────────────────────────────

class NotificationViewSet(viewsets.ModelViewSet):
    """Notifications for the authenticated user.

    GET /notifications/          → list (most recent first)
    GET /notifications/unread_count/ → {"count": N}
    POST /notifications/mark_read/   → {"notification_ids": [1,2,3]}
    POST /notifications/mark_all_read/ → marks everything as read
    DELETE /notifications/<id>/  → delete single notification
    POST /notifications/clear_all/ → delete all notifications for user
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    swagger_tags = ['Notifications']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Notification.objects.none()
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        # Optional filter
        is_read = request.query_params.get('is_read')
        if is_read is not None:
            qs = qs.filter(is_read=is_read.lower() in ('true', '1', 'yes'))
        serializer = self.get_serializer(qs[:100], many=True)  # Cap at 100
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'count': count})

    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        ids = request.data.get('notification_ids', [])
        if not ids:
            return Response({'detail': 'notification_ids required.'}, status=status.HTTP_400_BAD_REQUEST)
        updated = Notification.objects.filter(recipient=request.user, id__in=ids, is_read=False).update(is_read=True)
        return Response({'updated': updated})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        updated = Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'updated': updated})

    @action(detail=False, methods=['post'])
    def clear_all(self, request):
        deleted, _ = Notification.objects.filter(recipient=request.user).delete()
        return Response({'deleted': deleted})