from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class TypeOfService(models.Model):
    """Admin-managed lookup table for Type of Service dropdown."""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Type of Service'
        verbose_name_plural = 'Types of Service'

    def __str__(self):
        return self.name


class Ticket(models.Model):
    # --- Status choices ---
    STATUS_OPEN = 'open'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_CLOSED = 'closed'
    STATUS_ESCALATED = 'escalated'
    STATUS_ESCALATED_EXTERNAL = 'escalated_external'
    STATUS_PENDING_CLOSURE = 'pending_closure'
    STATUS_CHOICES = [
        (STATUS_OPEN, 'Open'),
        (STATUS_IN_PROGRESS, 'In Progress'),
        (STATUS_CLOSED, 'Closed'),
        (STATUS_ESCALATED, 'Escalated (Internal)'),
        (STATUS_ESCALATED_EXTERNAL, 'Escalated (External)'),
        (STATUS_PENDING_CLOSURE, 'Pending Closure'),
    ]

    # --- Priority choices (admin sets) ---
    PRIORITY_LOW = 'low'
    PRIORITY_MEDIUM = 'medium'
    PRIORITY_HIGH = 'high'
    PRIORITY_CRITICAL = 'critical'
    PRIORITY_CHOICES = [
        (PRIORITY_LOW, 'Low'),
        (PRIORITY_MEDIUM, 'Medium'),
        (PRIORITY_HIGH, 'High'),
        (PRIORITY_CRITICAL, 'Critical'),
    ]

    # --- Preferred support type (client sets at submission) ---
    SUPPORT_REMOTE = 'remote_online'
    SUPPORT_ONSITE = 'onsite'
    SUPPORT_CHAT = 'chat'
    SUPPORT_CALL = 'call'
    SUPPORT_TYPE_CHOICES = [
        (SUPPORT_REMOTE, 'Remote/Online'),
        (SUPPORT_ONSITE, 'Onsite'),
        (SUPPORT_CHAT, 'Chat'),
        (SUPPORT_CALL, 'Call'),
    ]

    # --- Job status choices (employee sets) ---
    JOB_COMPLETED = 'completed'
    JOB_PENDING = 'pending'
    JOB_UNDER_WARRANTY = 'under_warranty'
    JOB_CHARGEABLE = 'chargeable'
    JOB_FOR_QUOTATION = 'for_quotation'
    JOB_UNDER_CONTRACT = 'under_contract'
    JOB_STATUS_CHOICES = [
        (JOB_COMPLETED, 'Completed'),
        (JOB_PENDING, 'Pending'),
        (JOB_UNDER_WARRANTY, 'Under Warranty'),
        (JOB_CHARGEABLE, 'Chargeable'),
        (JOB_FOR_QUOTATION, 'For Quotation'),
        (JOB_UNDER_CONTRACT, 'Under Contract'),
    ]

    # ---- Original fields ----
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_OPEN)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='created_tickets', on_delete=models.CASCADE)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='assigned_tickets', null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ---- New client-side fields ----
    stf_no = models.CharField(max_length=30, unique=True, blank=True)
    date = models.DateField(default=timezone.now)  # coerced in save()
    time_in = models.DateTimeField(null=True, blank=True)       # populated when admin reviews
    time_out = models.DateTimeField(null=True, blank=True)      # placeholder for later dev
    client = models.CharField(max_length=200, blank=True)
    contact_person = models.CharField(max_length=200, blank=True)
    address = models.TextField(blank=True)
    designation = models.CharField(max_length=200, blank=True)
    landline = models.CharField(max_length=30, blank=True)
    department_organization = models.CharField(max_length=200, blank=True)
    mobile_no = models.CharField(max_length=11, blank=True)
    email_address = models.EmailField(blank=True)
    type_of_service = models.ForeignKey(TypeOfService, null=True, blank=True, on_delete=models.SET_NULL, related_name='tickets')
    type_of_service_others = models.CharField(max_length=200, blank=True)

    # ---- Admin-set field ----
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, blank=True, default='')
    confirmed_by_admin = models.BooleanField(default=False)

    # ---- Client-set fields (support preference & problem) ----
    preferred_support_type = models.CharField(max_length=20, choices=SUPPORT_TYPE_CHOICES, blank=True, default='')
    description_of_problem = models.TextField(blank=True)

    # ---- Employee-set fields ----
    # Product details
    has_warranty = models.BooleanField(default=False)
    product = models.CharField(max_length=300, blank=True)
    brand = models.CharField(max_length=300, blank=True)
    model_name = models.CharField(max_length=300, blank=True)
    device_equipment = models.CharField(max_length=300, blank=True)
    version_no = models.CharField(max_length=100, blank=True)
    date_purchased = models.DateField(null=True, blank=True)
    serial_no = models.CharField(max_length=200, blank=True)

    action_taken = models.TextField(blank=True)
    remarks = models.TextField(blank=True)

    job_status = models.CharField(max_length=20, choices=JOB_STATUS_CHOICES, blank=True, default='')

    # ---- External escalation fields ----
    external_escalated_to = models.CharField(max_length=300, blank=True, default='')
    external_escalation_notes = models.TextField(blank=True, default='')
    external_escalated_at = models.DateTimeField(null=True, blank=True)

    # Current active assignment session (for messaging scope)
    current_session = models.ForeignKey('AssignmentSession', null=True, blank=True, on_delete=models.SET_NULL, related_name='+')

    def save(self, *args, **kwargs):
        # Coerce date to a plain date if it's a datetime
        import datetime as _dt
        if isinstance(self.date, _dt.datetime):
            self.date = self.date.date()
        if not self.stf_no:
            self.stf_no = self._generate_stf_no()
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_stf_no():
        """Generate STF-MP-YYYYMMDDXXXXXX where XXXXXX is zero-padded sequence."""
        today = timezone.now()
        date_str = today.strftime('%Y%m%d')
        prefix = f'STF-MP-{date_str}'
        last = Ticket.objects.filter(stf_no__startswith=prefix).order_by('-stf_no').first()
        if last:
            try:
                seq = int(last.stf_no[-6:]) + 1
            except (ValueError, IndexError):
                seq = 1
        else:
            seq = 1
        return f'{prefix}{seq:06d}'

    def __str__(self):
        return f"{self.stf_no} ({self.status})"


class TicketAttachment(models.Model):
    """File attachments for tickets (images, videos, documents)."""
    ticket = models.ForeignKey(Ticket, related_name='attachments', on_delete=models.CASCADE)
    file = models.FileField(upload_to='ticket_attachments/%Y/%m/%d/')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='uploaded_attachments')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_resolution_proof = models.BooleanField(default=False)

    # ── Knowledge Hub publish fields ──
    is_published = models.BooleanField(default=False)
    published_title = models.CharField(max_length=300, blank=True, default='')
    published_description = models.TextField(blank=True, default='')
    published_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='published_attachments')
    published_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Attachment for {self.ticket.stf_no}: {self.file.name}"


class TicketTask(models.Model):
    STATUS_TODO = 'todo'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_DONE = 'done'
    STATUS_CHOICES = [
        (STATUS_TODO, 'To Do'),
        (STATUS_IN_PROGRESS, 'In Progress'),
        (STATUS_DONE, 'Done'),
    ]

    ticket = models.ForeignKey(Ticket, related_name='tasks', on_delete=models.CASCADE)
    description = models.CharField(max_length=500)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_TODO)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Task for {self.ticket.title}: {self.description[:30]}"


# ────────────────────────────────────────────
# Messaging models
# ────────────────────────────────────────────

class AssignmentSession(models.Model):
    """Tracks each assignment of an employee to a ticket.
    Messages are scoped to a session so new employees can't see old messages."""
    ticket = models.ForeignKey(Ticket, related_name='assignment_sessions', on_delete=models.CASCADE)
    employee = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='assignment_sessions', on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"Session #{self.id} — {self.employee.username} on {self.ticket.stf_no}"


class Message(models.Model):
    CHANNEL_ADMIN_EMPLOYEE = 'admin_employee'
    CHANNEL_CHOICES = [
        (CHANNEL_ADMIN_EMPLOYEE, 'Admin ↔ Employee'),
    ]

    ticket = models.ForeignKey(Ticket, related_name='messages', on_delete=models.CASCADE)
    assignment_session = models.ForeignKey(AssignmentSession, related_name='messages', on_delete=models.CASCADE)
    channel_type = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_messages', on_delete=models.CASCADE)
    content = models.TextField()
    reply_to = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='replies')
    is_system_message = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Msg #{self.id} by {self.sender.username} on {self.ticket.stf_no}"


class MessageReaction(models.Model):
    message = models.ForeignKey(Message, related_name='reactions', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='message_reactions', on_delete=models.CASCADE)
    emoji = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user', 'emoji')

    def __str__(self):
        return f"{self.user.username} reacted {self.emoji} to msg #{self.message.id}"


class MessageReadReceipt(models.Model):
    message = models.ForeignKey(Message, related_name='read_receipts', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='read_receipts', on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user')

    def __str__(self):
        return f"{self.user.username} read msg #{self.message.id}"


# ────────────────────────────────────────────
# Lifecycle models
# ────────────────────────────────────────────

class EscalationLog(models.Model):
    """Tracks every escalation event for reporting."""
    ESCALATION_INTERNAL = 'internal'
    ESCALATION_EXTERNAL = 'external'
    ESCALATION_TYPE_CHOICES = [
        (ESCALATION_INTERNAL, 'Internal (Staff)'),
        (ESCALATION_EXTERNAL, 'External (Distributor/Principal)'),
    ]

    ticket = models.ForeignKey(Ticket, related_name='escalation_logs', on_delete=models.CASCADE)
    escalation_type = models.CharField(max_length=20, choices=ESCALATION_TYPE_CHOICES)
    from_user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='escalations_from', null=True, blank=True, on_delete=models.SET_NULL)
    to_user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='escalations_to', null=True, blank=True, on_delete=models.SET_NULL)
    to_external = models.CharField(max_length=300, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Escalation on {self.ticket.stf_no} ({self.escalation_type})"


# ────────────────────────────────────────────
# Audit Log model
# ────────────────────────────────────────────

class AuditLog(models.Model):
    """Tracks every significant action across the system for superadmin audit trail."""

    # Entity types
    ENTITY_USER = 'User'
    ENTITY_TICKET = 'Ticket'
    ENTITY_SERVICE = 'TypeOfService'
    ENTITY_ESCALATION = 'EscalationLog'
    ENTITY_ATTACHMENT = 'Attachment'
    ENTITY_SESSION = 'Session'
    ENTITY_CHOICES = [
        (ENTITY_USER, 'User'),
        (ENTITY_TICKET, 'Ticket'),
        (ENTITY_SERVICE, 'Type of Service'),
        (ENTITY_ESCALATION, 'Escalation Log'),
        (ENTITY_ATTACHMENT, 'Attachment'),
        (ENTITY_SESSION, 'Session'),
    ]

    # Action types
    ACTION_CREATE = 'CREATE'
    ACTION_UPDATE = 'UPDATE'
    ACTION_DELETE = 'DELETE'
    ACTION_LOGIN = 'LOGIN'
    ACTION_LOGOUT = 'LOGOUT'
    ACTION_ASSIGN = 'ASSIGN'
    ACTION_ESCALATE = 'ESCALATE'
    ACTION_CLOSE = 'CLOSE'
    ACTION_STATUS_CHANGE = 'STATUS_CHANGE'
    ACTION_PASSWORD_RESET = 'PASSWORD_RESET'
    ACTION_CHOICES = [
        (ACTION_CREATE, 'Create'),
        (ACTION_UPDATE, 'Update'),
        (ACTION_DELETE, 'Delete'),
        (ACTION_LOGIN, 'Login'),
        (ACTION_LOGOUT, 'Logout'),
        (ACTION_ASSIGN, 'Assign'),
        (ACTION_ESCALATE, 'Escalate'),
        (ACTION_CLOSE, 'Close'),
        (ACTION_STATUS_CHANGE, 'Status Change'),
        (ACTION_PASSWORD_RESET, 'Password Reset'),
    ]

    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    entity = models.CharField(max_length=30, choices=ENTITY_CHOICES, db_index=True)
    entity_id = models.PositiveIntegerField(null=True, blank=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, db_index=True)
    activity = models.TextField(help_text='Human-readable description of the action')
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='audit_logs',
    )
    actor_email = models.EmailField(blank=True, default='', help_text='Snapshot of actor email at the time of the action')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    changes = models.JSONField(null=True, blank=True, help_text='JSON diff of changed fields')

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp', 'entity']),
            models.Index(fields=['actor', '-timestamp']),
        ]

    def __str__(self):
        return f"[{self.timestamp}] {self.action} {self.entity} by {self.actor_email}"

    @classmethod
    def log(cls, *, entity, entity_id=None, action, activity, actor=None, ip_address=None, changes=None):
        """Helper to create an audit log entry."""
        return cls.objects.create(
            entity=entity,
            entity_id=entity_id,
            action=action,
            activity=activity,
            actor=actor,
            actor_email=getattr(actor, 'email', '') if actor else '',
            ip_address=ip_address,
            changes=changes,
        )