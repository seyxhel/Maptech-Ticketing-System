from django.db import models
from django.conf import settings
from django.utils import timezone
from .lookup import TypeOfService
from .client import Client
from .product import Product


class Ticket(models.Model):
    # --- Status choices ---
    STATUS_OPEN = 'open'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_CLOSED = 'closed'
    STATUS_ESCALATED = 'escalated'
    STATUS_ESCALATED_EXTERNAL = 'escalated_external'
    STATUS_PENDING_CLOSURE = 'pending_closure'
    STATUS_FOR_OBSERVATION = 'for_observation'
    STATUS_UNRESOLVED = 'unresolved'
    STATUS_CHOICES = [
        (STATUS_OPEN, 'Open'),
        (STATUS_IN_PROGRESS, 'In Progress'),
        (STATUS_CLOSED, 'Closed'),
        (STATUS_ESCALATED, 'Escalated (Internal)'),
        (STATUS_ESCALATED_EXTERNAL, 'Escalated (External)'),
        (STATUS_PENDING_CLOSURE, 'Pending Closure'),
        (STATUS_FOR_OBSERVATION, 'For Observation'),
        (STATUS_UNRESOLVED, 'Unresolved'),
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

    # --- Cascade type choices (employee sets after resolving) ---
    CASCADE_INTERNAL = 'internal'
    CASCADE_EXTERNAL = 'external'
    CASCADE_TYPE_CHOICES = [
        (CASCADE_INTERNAL, 'Internal'),
        (CASCADE_EXTERNAL, 'External'),
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
    time_in = models.DateTimeField(null=True, blank=True)       # when employee starts working
    time_out = models.DateTimeField(null=True, blank=True)      # when employee clicks resolve
    type_of_service = models.ForeignKey(TypeOfService, null=True, blank=True, on_delete=models.SET_NULL, related_name='tickets')
    type_of_service_others = models.CharField(max_length=200, blank=True)

    # ---- FK to Client and Product (optional, for existing clients) ----
    client_record = models.ForeignKey(Client, null=True, blank=True, on_delete=models.SET_NULL, related_name='tickets',
                                      help_text='Link to existing client record')
    product_record = models.ForeignKey(Product, null=True, blank=True, on_delete=models.SET_NULL, related_name='tickets',
                                       help_text='Link to product from global catalog')

    # ---- Admin-set field ----
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, blank=True, default='')
    confirmed_by_admin = models.BooleanField(default=False)

    # ---- Product detail fields (per-ticket snapshot) ----
    product_name = models.CharField(max_length=300, blank=True, default='')
    brand = models.CharField(max_length=300, blank=True, default='')
    model_name = models.CharField(max_length=300, blank=True, default='')
    device_equipment = models.CharField(max_length=300, blank=True, default='')
    version_no = models.CharField(max_length=100, blank=True, default='')
    date_purchased = models.DateField(null=True, blank=True)
    serial_no = models.CharField(max_length=200, blank=True, default='')
    sales_no = models.CharField(max_length=200, blank=True, default='')
    has_warranty = models.BooleanField(default=False)
    others = models.TextField(blank=True, default='')

    # ---- Client-set fields (support preference & problem) ----
    preferred_support_type = models.CharField(max_length=20, choices=SUPPORT_TYPE_CHOICES, blank=True, default='')
    description_of_problem = models.TextField(blank=True)

    # ---- Employee-set fields ----
    action_taken = models.TextField(blank=True)
    remarks = models.TextField(blank=True)

    job_status = models.CharField(max_length=20, choices=JOB_STATUS_CHOICES, blank=True, default='')

    # ---- Cascade type (employee sets after resolving) ----
    cascade_type = models.CharField(max_length=20, choices=CASCADE_TYPE_CHOICES, blank=True, default='',
                                    help_text='Cascading type selected by employee when resolving')

    # ---- Observation (employee fills before resolving) ----
    observation = models.TextField(blank=True, default='',
                                   help_text='Employee observation before closing the ticket')

    # ---- Digital signature (base64 encoded image) ----
    signature = models.TextField(blank=True, default='',
                                 help_text='Base64 encoded signature image')
    signed_by_name = models.CharField(max_length=200, blank=True, default='',
                                      help_text='Name of person who signed')

    # ---- Estimated resolution days override (for "Others" type of service) ----
    estimated_resolution_days_override = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Override estimated resolution days when type of service is Others',
    )

    # ---- External escalation fields ----
    external_escalated_to = models.CharField(max_length=300, blank=True, default='')
    external_escalation_notes = models.TextField(blank=True, default='')
    external_escalated_at = models.DateTimeField(null=True, blank=True)

    # ---- Linked tickets (same problem / related) ----
    linked_tickets = models.ManyToManyField('self', blank=True,
                                            help_text='Related tickets (same problem)')

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

    @property
    def sla_estimated_days(self):
        """Return the effective estimated resolution days (from TypeOfService or override for Others)."""
        if self.estimated_resolution_days_override:
            return self.estimated_resolution_days_override
        if self.type_of_service and self.type_of_service.estimated_resolution_days:
            return self.type_of_service.estimated_resolution_days
        return 0

    @property
    def progress_percentage(self):
        """Milestone-based progress reflecting the ticket's lifecycle stage."""
        if self.status in (self.STATUS_CLOSED, self.STATUS_UNRESOLVED):
            return 100
        if self.status == self.STATUS_PENDING_CLOSURE:
            return 90
        if self.status in (self.STATUS_ESCALATED, self.STATUS_ESCALATED_EXTERNAL):
            return 70
        if self.status == self.STATUS_FOR_OBSERVATION:
            return 60
        if self.status == self.STATUS_IN_PROGRESS or self.time_in:
            return 40
        if self.assigned_to and self.confirmed_by_admin:
            return 25
        if self.confirmed_by_admin:
            return 15
        return 5

    @staticmethod
    def _generate_stf_no():
        """Generate STF-MT-YYYYMMDDXXXXXX where XXXXXX is zero-padded sequence."""
        today = timezone.now()
        date_str = today.strftime('%Y%m%d')
        prefix = f'STF-MT-{date_str}'
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
    published_tags = models.JSONField(default=list, blank=True)
    published_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='published_attachments')
    published_at = models.DateTimeField(null=True, blank=True)

    # ── Archive field ──
    is_archived = models.BooleanField(default=False)

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
        return f"Task for {self.ticket.stf_no}: {self.description[:30]}"
