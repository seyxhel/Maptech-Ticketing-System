from django.db import models
from django.conf import settings


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
    ACTION_PASS = 'PASS'
    ACTION_REVIEW = 'REVIEW'
    ACTION_RESOLVE = 'RESOLVE'
    ACTION_UPLOAD = 'UPLOAD'
    ACTION_CONFIRM = 'CONFIRM'
    ACTION_OBSERVE = 'OBSERVE'
    ACTION_UNRESOLVED = 'UNRESOLVED'
    ACTION_LINK = 'LINK'
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
        (ACTION_PASS, 'Pass'),
        (ACTION_REVIEW, 'Review'),
        (ACTION_RESOLVE, 'Resolve'),
        (ACTION_UPLOAD, 'Upload'),
        (ACTION_CONFIRM, 'Confirm'),
        (ACTION_OBSERVE, 'Submit for Observation'),
        (ACTION_UNRESOLVED, 'Mark Unresolved'),
        (ACTION_LINK, 'Link Tickets'),
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
