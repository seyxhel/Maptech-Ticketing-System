from rest_framework import viewsets, status
from django.db.models import Count, Q
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils import timezone
from pathlib import Path

from tickets.input_security import clean_text, clean_text_list

from ..models import (
    Ticket, TicketTask, TicketAttachment, AssignmentSession,
    Message, EscalationLog, AuditLog, Product, Client,
)
from ..serializers import (
    TicketSerializer, TypeOfServiceSerializer, TicketAttachmentSerializer,
    EscalationLogSerializer, MessageSerializer, AssignmentSessionSerializer,
    AdminCreateTicketSerializer, EmployeeTicketActionSerializer,
)
from ..permissions import IsAdminLevel, IsSupervisorLevel, IsAssignedEmployee, IsAdminOrAssignedEmployee, IsTicketParticipant
from users.serializers import UserSerializer
from ._helpers import _get_client_ip

User = get_user_model()

BYTES_PER_MB = 1024 * 1024
BYTES_PER_GB = BYTES_PER_MB * 1024
MAX_IMAGE_ATTACHMENT_SIZE = 500 * BYTES_PER_MB
MAX_VIDEO_ATTACHMENT_SIZE = 2 * BYTES_PER_GB
MAX_DOCUMENT_ATTACHMENT_SIZE = 500 * BYTES_PER_MB


def _clean_ticket_text(value, *, max_length=None, allow_newlines=False, strip_tags=True):
    return clean_text(
        value,
        max_length=max_length,
        allow_newlines=allow_newlines,
        strip_tags=strip_tags,
    )


def _get_attachment_type(file):
    content_type = (getattr(file, 'content_type', '') or '').lower()
    extension = Path(getattr(file, 'name', '')).suffix.lower()

    if content_type.startswith('image/') or extension in {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'}:
        return 'screenshot'
    if content_type.startswith('video/') or extension in {'.mp4', '.webm'}:
        return 'recording'
    if content_type in {
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    } or extension in {'.pdf', '.doc', '.docx', '.xls', '.xlsx'}:
        return 'file'
    return None


def _get_attachment_size_limit(attachment_type):
    if attachment_type == 'recording':
        return MAX_VIDEO_ATTACHMENT_SIZE
    if attachment_type == 'file':
        return MAX_DOCUMENT_ATTACHMENT_SIZE
    return MAX_IMAGE_ATTACHMENT_SIZE


def _get_attachment_limit_label(attachment_type):
    if attachment_type == 'recording':
        return '2 GB'
    return '500 MB'


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all().order_by('-created_at')
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]
    swagger_tags = ['Tickets']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Ticket.objects.none()
        user = self.request.user
        if user.role == User.ROLE_SALES:
            return Ticket.objects.filter(created_by=user).order_by('-created_at')
        if user.role in (User.ROLE_ADMIN, User.ROLE_SUPERADMIN):
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
            supervisor_id = serializer.validated_data.pop('supervisor_id', None) or request.data.get('supervisor_id')
            client_unavailable_for_call = serializer.validated_data.pop('client_unavailable_for_call', False)
            is_existing = serializer.validated_data.pop('is_existing_client', False)
            type_of_service_others = serializer.validated_data.pop('type_of_service_others', '') or ''

            if supervisor_id:
                try:
                    sup = User.objects.get(id=supervisor_id, role=User.ROLE_ADMIN, is_active=True)
                    serializer.validated_data['supervisor'] = sup
                except User.DoesNotExist:
                    return Response({'detail': 'Selected supervisor was not found.'}, status=status.HTTP_400_BAD_REQUEST)

            if user.role == User.ROLE_SALES and not serializer.validated_data.get('supervisor'):
                return Response({'detail': 'Supervisor is required for sales-created tickets.'}, status=status.HTTP_400_BAD_REQUEST)

            # Extract write-only client text fields (no longer on the Ticket model)
            client_text = {
                'client_name':             serializer.validated_data.pop('client', '') or '',
                'contact_person':          serializer.validated_data.pop('contact_person', '') or '',
                'address':                 serializer.validated_data.pop('address', '') or '',
                'designation':             serializer.validated_data.pop('designation', '') or '',
                'landline':                serializer.validated_data.pop('landline', '') or '',
                'department_organization': serializer.validated_data.pop('department_organization', '') or '',
                'mobile_no':               serializer.validated_data.pop('mobile_no', '') or '',
                'email_address':           serializer.validated_data.pop('email_address', '') or '',
                'sales_representative':    serializer.validated_data.pop('sales_representative', '') or '',
            }

            # For new (non-existing) clients, auto-create a Client record
            if not is_existing and not serializer.validated_data.get('client_record'):
                if any(client_text.values()):
                    if not client_text['client_name']:
                        client_text['client_name'] = 'Unknown'
                    if not client_text['sales_representative']:
                        return Response(
                            {'detail': 'Sales Representative is required for new clients.'},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    serializer.validated_data['client_record'] = Client.objects.create(**client_text)

            linked_product = serializer.validated_data.get('product_record')

            # Extract write-only product text fields
            product_text = {
                'project_title':           serializer.validated_data.pop('project_title', '') or '',
                'product_name':            serializer.validated_data.pop('product', '') or '',
                'brand':                   serializer.validated_data.pop('brand', '') or '',
                'model_name':              serializer.validated_data.pop('model_name', '') or '',
                'device_equipment':        serializer.validated_data.pop('device_equipment', '') or '',
                'version_no':              serializer.validated_data.pop('version_no', '') or '',
                'firmware_version':        serializer.validated_data.pop('firmware_version', '') or '',
                'software_name':           serializer.validated_data.pop('software_name', '') or '',
                'software_version':        serializer.validated_data.pop('software_version', '') or '',
                'software_vendor':         serializer.validated_data.pop('software_vendor', '') or '',
                'software_license_key':    serializer.validated_data.pop('software_license_key', '') or '',
                'software_metadata':       serializer.validated_data.pop('software_metadata', '') or '',
                'date_purchased':          serializer.validated_data.pop('date_purchased', None),
                'serial_no':               serializer.validated_data.pop('serial_no', '') or '',
                'sales_no':                serializer.validated_data.pop('sales_no', '') or '',
                'client_purchase_no':      serializer.validated_data.pop('client_purchase_no', '') or '',
                'maptech_dr':              serializer.validated_data.pop('maptech_dr', '') or '',
                'maptech_sales_invoice':   serializer.validated_data.pop('maptech_sales_invoice', '') or '',
                'maptech_sales_order_no':  serializer.validated_data.pop('maptech_sales_order_no', '') or '',
                'supplier_purchase_no':    serializer.validated_data.pop('supplier_purchase_no', '') or '',
                'supplier_sales_invoice':  serializer.validated_data.pop('supplier_sales_invoice', '') or '',
                'supplier_delivery_receipt': serializer.validated_data.pop('supplier_delivery_receipt', '') or '',
                'has_warranty':            serializer.validated_data.pop('has_warranty', False) or False,
                'others':                  serializer.validated_data.pop('others', '') or '',
            }

            if linked_product:
                if not product_text['project_title']:
                    product_text['project_title'] = linked_product.project_title
                for field in (
                    'product_name', 'brand', 'model_name', 'device_equipment', 'version_no', 'firmware_version',
                    'software_name', 'software_version', 'software_vendor', 'software_license_key', 'software_metadata',
                    'serial_no', 'sales_no',
                    'client_purchase_no', 'maptech_dr', 'maptech_sales_invoice', 'maptech_sales_order_no',
                    'supplier_purchase_no', 'supplier_sales_invoice', 'supplier_delivery_receipt',
                ):
                    if product_text[field] in (None, ''):
                        product_text[field] = getattr(linked_product, field, product_text[field])
                if not product_text['has_warranty']:
                    product_text['has_warranty'] = bool(getattr(linked_product, 'has_warranty', False))

                # Persist explicitly provided product detail values onto the linked product record.
                linked_update_fields = []
                for field in (
                    'firmware_version', 'software_name', 'software_version', 'software_vendor', 'software_license_key', 'software_metadata',
                    'sales_no', 'client_purchase_no', 'maptech_dr', 'maptech_sales_invoice', 'maptech_sales_order_no',
                    'supplier_purchase_no', 'supplier_sales_invoice', 'supplier_delivery_receipt',
                ):
                    if field in serializer.initial_data and serializer.initial_data.get(field) not in (None, ''):
                        incoming = product_text[field]
                        if getattr(linked_product, field, '') != incoming:
                            setattr(linked_product, field, incoming)
                            linked_update_fields.append(field)
                if linked_update_fields:
                    linked_product.save(update_fields=linked_update_fields)

            # If no product_record linked and product data present, auto-create a Product record
            if not serializer.validated_data.get('product_record'):
                if any(v for v in product_text.values() if v not in (None, '', False)):
                    if not serializer.validated_data.get('client_record'):
                        return Response(
                            {'detail': 'A client is required to create a product.'},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    if not product_text['project_title']:
                        return Response(
                            {'detail': 'A project title is required to create a product.'},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    product_record_data = {
                        key: value
                        for key, value in product_text.items()
                        if key != 'others'
                    }
                    product_record_data['client'] = serializer.validated_data['client_record']
                    serializer.validated_data['product_record'] = Product.objects.create(**product_record_data)

            # Product details are stored on the linked `Product` record (`product_record`).
            # Do not inject product fields into `validated_data` — the Ticket model no longer
            # contains those columns and passing them to `Ticket.objects.create()` raises.

            ticket = serializer.save(created_by=user)

            if type_of_service_others and ticket.type_of_service:
                ticket.type_of_service.type_of_service_others = type_of_service_others
                ticket.type_of_service.save(update_fields=['type_of_service_others'])

            if not client_unavailable_for_call and priority and priority in dict(Ticket.PRIORITY_CHOICES):
                ticket.priority = priority

            if user.role != User.ROLE_SALES and assign_to_id:
                try:
                    emp = User.objects.get(id=assign_to_id, role=User.ROLE_EMPLOYEE)
                    new_session = AssignmentSession.objects.create(ticket=ticket, employee=emp)
                    ticket.assigned_to = emp
                    ticket.current_session = new_session
                except User.DoesNotExist:
                    pass

            # Keep tickets unconfirmed only when client is unavailable or when a sales-created
            # ticket still has no priority. If sales already completed call + priority,
            # mark as confirmed so supervisors can assign immediately.
            ticket.confirmed_by_admin = (
                (not client_unavailable_for_call)
                and (user.role != User.ROLE_SALES or bool(ticket.priority))
            )
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

            product_field_map = {
                'has_warranty': 'has_warranty',
                'product': 'product_name',
                'brand': 'brand',
                'model_name': 'model_name',
                'device_equipment': 'device_equipment',
                'version_no': 'version_no',
                'date_purchased': 'date_purchased',
                'serial_no': 'serial_no',
                'others': 'others',
            }
            ticket_fields = ['action_taken', 'remarks', 'job_status']

            for req_field, model_field in product_field_map.items():
                val = serializer.validated_data.get(req_field)
                if val not in (None, ''):
                    setattr(ticket, model_field, val)

            for field in ticket_fields:
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
            'assign':                   [IsAuthenticated(), IsSupervisorLevel()],
            'review':                   [IsAuthenticated(), IsAdminLevel()],
            'confirm_ticket':           [IsAuthenticated(), IsAdminLevel()],
            'close_ticket':             [IsAuthenticated(), IsAdminLevel()],
            # Assigned-employee-only actions
            'escalate':                 [IsAuthenticated(), IsAssignedEmployee()],
            'pass_ticket':              [IsAuthenticated(), IsAssignedEmployee()],
            'request_closure':          [IsAuthenticated(), IsAssignedEmployee()],
            # Admin or assigned employee
            'escalate_external':        [IsAuthenticated(), IsAdminOrAssignedEmployee()],
            'upload_resolution_proof':  [IsAuthenticated(), IsAdminOrAssignedEmployee()],
            'update_task':              [IsAuthenticated(), IsAdminOrAssignedEmployee()],
            # Admin or assigned employee — processing actions
            'start_work':               [IsAuthenticated(), IsAdminOrAssignedEmployee()],
            'submit_for_observation':   [IsAuthenticated(), IsAdminOrAssignedEmployee()],
            'update_employee_fields':   [IsAuthenticated(), IsAdminOrAssignedEmployee()],
            'save_product_details':     [IsAuthenticated(), IsAdminOrAssignedEmployee()],
            # Admin: link tickets
            'link_tickets':             [IsAuthenticated(), IsAdminLevel()],
            # Delete attachment (resolution proofs)
            'delete_attachment':        [IsAuthenticated(), IsTicketParticipant()],
        }
        return perm_map.get(self.action, [IsAuthenticated()])

    @action(detail=False, methods=['get'])
    def next_stf_no(self, request):
        return Response({'stf_no': Ticket.get_next_stf_no()})

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        ticket = self.get_object()

        if not ticket.confirmed_by_admin:
            return Response(
                {'detail': 'This ticket is pending client availability. Complete call and priority review first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Block reassignment if the employee has already clicked Start Work,
        # unless the ticket is escalated (admin must be able to reassign after escalation),
        # or the current assignee is an admin (admins can reassign even after time_in).
        if ticket.time_in is not None and ticket.status != Ticket.STATUS_ESCALATED:
            current_assignee = ticket.assigned_to
            # Allow reassignment if the current assignee exists and is an admin
            if not (current_assignee and getattr(current_assignee, 'role', None) == User.ROLE_ADMIN):
                return Response(
                    {'detail': 'Cannot reassign after the employee has already started working.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        terminal_statuses = [
            Ticket.STATUS_CLOSED,
            Ticket.STATUS_PENDING_CLOSURE,
            Ticket.STATUS_UNRESOLVED,
        ]
        if ticket.status in terminal_statuses:
            return Response(
                {'detail': 'Cannot reassign a closed or resolved ticket.'},
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

        # Create system message about reassignment
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
                    'sender_name': sender.get_full_name() or sender.username,
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
        """Employee escalates ticket internally."""
        ticket = self.get_object()
        user = request.user
        notes = _clean_ticket_text(request.data.get('notes', ''), allow_newlines=True)

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

        # Assign ticket to the admin who originally created it
        admin_creator = ticket.created_by
        new_session = AssignmentSession.objects.create(ticket=ticket, employee=admin_creator)
        ticket.assigned_to = admin_creator
        ticket.current_session = new_session
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
        """Employee passes ticket to another employee."""
        ticket = self.get_object()
        user = request.user
        to_emp_id = request.data.get('employee_id')
        notes = _clean_ticket_text(request.data.get('notes', ''), allow_newlines=True)
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
        """Admin-level user reviews a ticket and can set priority."""
        ticket = self.get_object()

        # Sales can only review their own unconfirmed tickets during call workflow.
        if request.user.role == User.ROLE_SALES and ticket.confirmed_by_admin:
            return Response({'detail': 'This ticket is already confirmed.'}, status=status.HTTP_400_BAD_REQUEST)

        priority = request.data.get('priority')
        if priority:
            if priority not in dict(Ticket.PRIORITY_CHOICES):
                return Response({'detail': 'Invalid priority value.'}, status=status.HTTP_400_BAD_REQUEST)
            ticket.priority = priority
        elif request.user.role == User.ROLE_SALES:
            return Response({'detail': 'Priority is required for sales call review.'}, status=status.HTTP_400_BAD_REQUEST)

        ticket.save()

        self._audit_ticket(request, ticket, AuditLog.ACTION_REVIEW,
                           f"{request.user.email} reviewed ticket {ticket.stf_no}",
                           changes={'priority': ticket.priority})

        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['patch'])
    def save_product_details(self, request, pk=None):
        """Employee saves product detail fields directly on the ticket."""
        ticket = self.get_object()
        product_field_map = {
            'has_warranty': 'has_warranty',
            'product': 'product_name',
            'brand': 'brand',
            'model_name': 'model_name',
            'device_equipment': 'device_equipment',
            'version_no': 'version_no',
            'date_purchased': 'date_purchased',
            'serial_no': 'serial_no',
            'sales_no': 'sales_no',
            'others': 'others',
        }

        changes = {}
        product_field_rules = {
            'product': {'max_length': 300},
            'brand': {'max_length': 300},
            'model_name': {'max_length': 300},
            'device_equipment': {'max_length': 300},
            'version_no': {'max_length': 100},
            'serial_no': {'max_length': 200},
            'sales_no': {'max_length': 200},
            'others': {'max_length': None, 'allow_newlines': True},
        }
        # Collect any provided product fields and persist them to the linked Product when possible.
        provided_product_fields = {k: v for k, v in request.data.items() if k in (
            'product', 'brand', 'model_name', 'device_equipment', 'version_no',
            'firmware_version', 'software_name', 'software_version', 'software_vendor', 'software_license_key', 'software_metadata',
            'date_purchased', 'serial_no', 'sales_no', 'has_warranty', 'others',
        )}

        # Clean values according to rules
        for key in list(provided_product_fields.keys()):
            if key in product_field_rules:
                provided_product_fields[key] = _clean_ticket_text(provided_product_fields[key], **product_field_rules[key])

        # If the ticket has a linked product_record, update it with incoming product fields
        linked = ticket.product_record
        if linked:
            linked_update_fields = []
            for field, incoming in provided_product_fields.items():
                # map incoming keys to Product model attribute names
                attr = 'product_name' if field == 'product' else field
                if incoming is None:
                    continue
                if getattr(linked, attr, None) != incoming:
                    setattr(linked, attr, incoming)
                    linked_update_fields.append(attr)
            if linked_update_fields:
                linked.save(update_fields=linked_update_fields)
                changes.update({k: provided_product_fields[k] for k in provided_product_fields})
        else:
            # No linked product — if product fields provided and ticket has a client, create a Product
            if provided_product_fields and ticket.client_record:
                create_kwargs = {
                    'client': ticket.client_record,
                    'project_title': provided_product_fields.get('project_title', '') or ticket.client_record.client_name,
                }
                for field, val in provided_product_fields.items():
                    attr = 'product_name' if field == 'product' else field
                    create_kwargs[attr] = val
                new_prod = Product.objects.create(**create_kwargs)
                ticket.product_record = new_prod
                ticket.save(update_fields=['product_record'])
                changes.update({k: provided_product_fields[k] for k in provided_product_fields})

        # Fallback: also apply any simpler ticket-level fields (legacy behavior)
        for req_field, model_field in product_field_map.items():
            if req_field in request.data:
                raw_value = request.data[req_field]
                if req_field in product_field_rules:
                    raw_value = _clean_ticket_text(raw_value, **product_field_rules[req_field])
                # Only set if the ticket model actually has the attribute
                if hasattr(ticket, model_field):
                    setattr(ticket, model_field, raw_value)
                    changes[req_field] = raw_value

        if changes and not ticket.product_record:
            ticket.save()

        self._audit_ticket(request, ticket, AuditLog.ACTION_UPDATE,
                           f"{request.user.email} updated product details on ticket {ticket.stf_no}",
                           changes=changes)

        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['patch'])
    def update_employee_fields(self, request, pk=None):
        """Employee updates their specific fields on a ticket."""
        ticket = self.get_object()
        product_field_map = {
            'has_warranty': 'has_warranty',
            'product': 'product_name',
            'brand': 'brand',
            'model_name': 'model_name',
            'device_equipment': 'device_equipment',
            'version_no': 'version_no',
            'date_purchased': 'date_purchased',
            'serial_no': 'serial_no',
            'others': 'others',
        }
        ticket_allowed = [
            'action_taken', 'remarks', 'job_status',
            'cascade_type', 'observation', 'signature', 'signed_by_name',
        ]

        product_field_rules = {
            'product': {'max_length': 300},
            'brand': {'max_length': 300},
            'model_name': {'max_length': 300},
            'device_equipment': {'max_length': 300},
            'version_no': {'max_length': 100},
            'serial_no': {'max_length': 200},
            'others': {'max_length': None, 'allow_newlines': True},
        }
        ticket_field_rules = {
            'action_taken': {'max_length': None, 'allow_newlines': True},
            'remarks': {'max_length': None, 'allow_newlines': True},
            'observation': {'max_length': None, 'allow_newlines': True},
            'signature': {'max_length': None, 'allow_newlines': True, 'strip_tags': False},
            'signed_by_name': {'max_length': 200},
        }

        for req_field, model_field in product_field_map.items():
            if req_field in request.data:
                value = request.data[req_field]
                if req_field in product_field_rules:
                    value = _clean_ticket_text(value, **product_field_rules[req_field])
                setattr(ticket, model_field, value)

        for field in ticket_allowed:
            if field in request.data:
                value = request.data[field]
                if field in ticket_field_rules:
                    value = _clean_ticket_text(value, **ticket_field_rules[field])
                setattr(ticket, field, value)

        old_status = ticket.status

        ticket.status = Ticket.STATUS_PENDING_CLOSURE
        if not ticket.time_out:
            ticket.time_out = timezone.now()

        ticket.save()

        action_type = AuditLog.ACTION_RESOLVE if ticket.status == Ticket.STATUS_PENDING_CLOSURE else AuditLog.ACTION_UPDATE
        all_fields = list(product_field_map.keys()) + ticket_allowed
        self._audit_ticket(request, ticket, action_type,
                           f"{request.user.email} updated fields on ticket {ticket.stf_no} (status: {old_status} → {ticket.status})",
                           changes={f: request.data[f] for f in all_fields if f in request.data})

        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'])
    def submit_for_observation(self, request, pk=None):
        """Employee submits ticket for observation — saves fields without resolving."""
        ticket = self.get_object()
        user = request.user
        allowed = [
            'action_taken', 'remarks', 'observation',
            'job_status', 'cascade_type', 'signature', 'signed_by_name',
        ]
        field_rules = {
            'action_taken': {'max_length': None, 'allow_newlines': True},
            'remarks': {'max_length': None, 'allow_newlines': True},
            'observation': {'max_length': None, 'allow_newlines': True},
            'signature': {'max_length': None, 'allow_newlines': True, 'strip_tags': False},
            'signed_by_name': {'max_length': 200},
        }
        for field in allowed:
            if field in request.data:
                value = request.data[field]
                if field in field_rules:
                    value = _clean_ticket_text(value, **field_rules[field])
                setattr(ticket, field, value)

        old_status = ticket.status
        ticket.status = Ticket.STATUS_FOR_OBSERVATION
        ticket.save()

        sys_content = f"{user.get_full_name() or user.username} submitted this ticket for observation."
        if request.data.get('observation'):
            sys_content += f" Observation: {_clean_ticket_text(request.data['observation'], max_length=200, allow_newlines=True)}"
        for ch in ['admin_employee']:
            Message.objects.create(
                ticket=ticket,
                channel_type=ch,
                sender=user,
                content=sys_content,
                is_system_message=True,
            )
            self._broadcast_system_message(ticket.id, ch, sys_content, user)

        self._audit_ticket(request, ticket, AuditLog.ACTION_OBSERVE,
                           f"{user.email} submitted ticket {ticket.stf_no} for observation (status: {old_status} → {ticket.status})",
                           changes={f: request.data[f] for f in allowed if f in request.data})

        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'])
    def link_tickets(self, request, pk=None):
        """Supervisor links this ticket to other tickets (same problem / related)."""
        ticket = self.get_object()
        ticket_ids = request.data.get('ticket_ids', [])
        if not ticket_ids or not isinstance(ticket_ids, list):
            return Response({'detail': 'ticket_ids required (list of ticket IDs)'}, status=status.HTTP_400_BAD_REQUEST)

        tickets_to_link = Ticket.objects.filter(id__in=ticket_ids).exclude(id=ticket.id)
        if not tickets_to_link.exists():
            return Response({'detail': 'No valid tickets found to link.'}, status=status.HTTP_400_BAD_REQUEST)

        ticket.linked_tickets.add(*tickets_to_link)

        linked_stfs = list(tickets_to_link.values_list('stf_no', flat=True))
        self._audit_ticket(request, ticket, AuditLog.ACTION_LINK,
                           f"{request.user.email} linked ticket {ticket.stf_no} to {', '.join(linked_stfs)}",
                           changes={'linked_ticket_ids': list(tickets_to_link.values_list('id', flat=True))})

        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'])
    def confirm_ticket(self, request, pk=None):
        """Admin-level user confirms client call verification for a ticket."""
        ticket = self.get_object()

        # Sales must set priority first before confirming call verification.
        if request.user.role == User.ROLE_SALES and not ticket.priority:
            return Response({'detail': 'Set a priority before confirming this ticket.'}, status=status.HTTP_400_BAD_REQUEST)

        ticket.confirmed_by_admin = True
        ticket.save()

        self._audit_ticket(request, ticket, AuditLog.ACTION_CONFIRM,
                           f"{request.user.email} confirmed ticket {ticket.stf_no}")

        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'])
    def escalate_external(self, request, pk=None):
        """Admin or assigned employee escalates to distributor/principal (external)."""
        user = request.user
        ticket = self.get_object()

        escalated_to = _clean_ticket_text(request.data.get('escalated_to', ''), max_length=300)
        notes = _clean_ticket_text(request.data.get('notes', ''), allow_newlines=True)
        if not escalated_to:
            return Response({'detail': 'escalated_to required (distributor/principal name)'}, status=status.HTTP_400_BAD_REQUEST)

        EscalationLog.objects.create(
            ticket=ticket,
            escalation_type=EscalationLog.ESCALATION_EXTERNAL,
            from_user=user,
            to_external=escalated_to,
            notes=notes,
        )

        ticket.external_escalated_to = escalated_to
        ticket.external_escalation_notes = notes
        ticket.external_escalated_at = timezone.now()
        ticket.save()

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

        # Require feedback ratings before closing
        if not hasattr(ticket, 'feedback_rating') or not ticket.feedback_rating:
            if ticket.assigned_to and ticket.assigned_to != request.user:
                return Response(
                    {'detail': 'Please submit feedback ratings for the employee before closing this ticket.'},
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
        validated_files = []
        for f in files:
            attachment_type = _get_attachment_type(f)
            if not attachment_type:
                return Response(
                    {'detail': f'"{f.name}" is not a supported attachment type. Use images, videos, PDF, DOC, DOCX, XLS, or XLSX.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            size_limit = _get_attachment_size_limit(attachment_type)
            if f.size > size_limit:
                return Response(
                    {'detail': f'"{f.name}" exceeds the {_get_attachment_limit_label(attachment_type)} limit.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            validated_files.append((f, attachment_type))

        for f, _attachment_type in validated_files:
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
        if not request.user.is_admin_level and att.uploaded_by != request.user:
            return Response({'detail': 'You can only delete your own attachments.'}, status=status.HTTP_403_FORBIDDEN)
        file_name = att.file.name if att.file else 'unknown'
        att.file.delete(save=False)
        att.delete()

        self._audit_ticket(request, ticket, AuditLog.ACTION_DELETE,
                           f"{request.user.email} deleted attachment '{file_name}' from ticket {ticket.stf_no}",
                           changes={'attachment_id': int(att_id), 'file_name': file_name})

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def start_work(self, request, pk=None):
        """Employee or admin marks they are starting work on a ticket."""
        ticket = self.get_object()
        if not ticket.time_in:
            ticket.time_in = timezone.now()
        processable_statuses = [
            Ticket.STATUS_OPEN,
            Ticket.STATUS_ESCALATED,
        ]
        if ticket.status in processable_statuses:
            ticket.status = Ticket.STATUS_IN_PROGRESS
        ticket.save()

        self._audit_ticket(request, ticket, AuditLog.ACTION_UPDATE,
                           f"{request.user.email} started working on ticket {ticket.stf_no}",
                           changes={'time_in': str(ticket.time_in), 'status': ticket.status})

        return Response(self.get_serializer(ticket).data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Dashboard statistics scoped to user role."""
        from django.db.models import Avg, F, ExpressionWrapper, DurationField
        qs = self.get_queryset()
        by_status = dict(qs.values_list('status').annotate(c=Count('id')).values_list('status', 'c'))
        by_priority = dict(qs.exclude(priority='').values_list('priority').annotate(c=Count('id')).values_list('priority', 'c'))
        total = qs.count()
        open_count = by_status.get(Ticket.STATUS_OPEN, 0)
        in_progress = by_status.get(Ticket.STATUS_IN_PROGRESS, 0)
        closed = by_status.get(Ticket.STATUS_CLOSED, 0)
        escalated = by_status.get(Ticket.STATUS_ESCALATED, 0) + by_status.get(Ticket.STATUS_ESCALATED_EXTERNAL, 0)
        pending = by_status.get(Ticket.STATUS_PENDING_CLOSURE, 0)

        closed_with_times = qs.filter(status=Ticket.STATUS_CLOSED, time_in__isnull=False, time_out__isnull=False)
        avg_resolution = 0
        if closed_with_times.exists():
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
            'avg_resolution_time': avg_resolution,
        })

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Return message history for the ticket (scoped by channel_type param)."""
        ticket = self.get_object()
        user = request.user

        if not (user.is_admin_level or ticket.assigned_to == user):
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)

        qs = Message.objects.filter(ticket=ticket).order_by('created_at')

        channel = request.query_params.get('channel')
        if channel in ('admin_employee',):
            qs = qs.filter(channel_type=channel)

        if getattr(user, 'role', None) == User.ROLE_EMPLOYEE:
            if ticket.current_session:
                qs = qs.filter(assignment_session=ticket.current_session)
            else:
                qs = qs.none()

        return Response(MessageSerializer(qs, many=True).data)

    @action(detail=True, methods=['get'], url_path='assignment_history')
    def assignment_history(self, request, pk=None):
        """Return all assignment sessions for this ticket (admin/employee only)."""
        ticket = self.get_object()
        user = request.user
        if not (user.is_admin_level or ticket.assigned_to == user):
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        sessions = AssignmentSession.objects.filter(ticket=ticket).order_by('-started_at')
        return Response(AssignmentSessionSerializer(sessions, many=True).data)


from ..models import TypeOfService
from drf_yasg.utils import swagger_auto_schema
from rest_framework.decorators import api_view, permission_classes


class TypeOfServiceViewSet(viewsets.ModelViewSet):
    """CRUD for Type of Service (admin manages, all authenticated can list active)."""
    queryset = TypeOfService.objects.all().order_by('name')
    serializer_class = TypeOfServiceSerializer
    swagger_tags = ['Type of Service']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
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

    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export escalation logs as CSV."""
        import csv
        from django.http import HttpResponse as DjangoHttpResponse

        qs = self.get_queryset().select_related('ticket', 'from_user', 'to_user')
        response = DjangoHttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="escalation_logs_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'

        writer = csv.writer(response)
        writer.writerow(['Ticket Number', 'Escalation Type', 'From User', 'To User', 'External Recipient', 'Notes', 'Created At'])
        for log in qs[:5000]:
            from_user_name = ''
            if log.from_user:
                full = log.from_user.get_full_name()
                from_user_name = full if full.strip() else log.from_user.username
            
            to_user_name = ''
            if log.to_user:
                full = log.to_user.get_full_name()
                to_user_name = full if full.strip() else log.to_user.username

            writer.writerow([
                log.ticket.stf_no if log.ticket else '',
                log.escalation_type,
                from_user_name,
                to_user_name,
                log.to_external or '',
                log.notes,
                log.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            ])

        return response


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
    emp_counts = {e.id: e.active_ticket_count for e in employees}
    for d in data:
        d['active_ticket_count'] = emp_counts.get(d['id'], 0)
    return Response(data)


@swagger_auto_schema(method='get', tags=['Users'])
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_sales_users(request):
    """Return active sales users for sales representative pickers."""
    if not (request.user.is_admin_level or request.user.role == User.ROLE_SALES):
        return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)

    sales_users = User.objects.filter(role=User.ROLE_SALES, is_active=True).order_by('first_name', 'last_name', 'username')
    data = UserSerializer(sales_users, many=True).data
    return Response(data)


@swagger_auto_schema(method='get', tags=['Users'])
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_supervisors(request):
    """Return active supervisors (admin) for sales routing."""
    if not request.user.is_authenticated:
        return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)

    supervisors = User.objects.filter(
        role=User.ROLE_ADMIN,
        is_active=True,
    ).order_by('first_name', 'last_name', 'username')
    data = UserSerializer(supervisors, many=True).data
    return Response(data)
