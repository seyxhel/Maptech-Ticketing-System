from django.db import models
from django.conf import settings
from .ticket import Ticket


class Notification(models.Model):
    """In-app notifications delivered in real-time via WebSocket and persisted for history."""

    TYPE_ASSIGNMENT = 'assignment'
    TYPE_ESCALATION = 'escalation'
    TYPE_STATUS_CHANGE = 'status_change'
    TYPE_NEW_TICKET = 'new_ticket'
    TYPE_SLA_WARNING = 'sla_warning'
    TYPE_CLOSURE = 'closure'
    TYPE_MESSAGE = 'message'
    TYPE_GENERAL = 'general'
    TYPE_CHOICES = [
        (TYPE_ASSIGNMENT, 'Ticket Assignment'),
        (TYPE_ESCALATION, 'Escalation'),
        (TYPE_STATUS_CHANGE, 'Status Change'),
        (TYPE_NEW_TICKET, 'New Ticket'),
        (TYPE_SLA_WARNING, 'SLA Warning'),
        (TYPE_CLOSURE, 'Closure'),
        (TYPE_MESSAGE, 'New Message'),
        (TYPE_GENERAL, 'General'),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='notifications',
        on_delete=models.CASCADE,
        help_text='The user who receives this notification',
    )
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_GENERAL)
    title = models.CharField(max_length=300)
    message = models.TextField(blank=True, default='')
    ticket = models.ForeignKey(
        Ticket, null=True, blank=True, on_delete=models.CASCADE,
        related_name='notifications',
        help_text='The related ticket (optional)',
    )
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read', '-created_at']),
        ]

    def __str__(self):
        return f"[{self.notification_type}] {self.title} → {self.recipient.username}"

    @classmethod
    def notify(cls, *, recipient, notification_type, title, message='', ticket=None):
        """Create a notification and push it via WebSocket channel layer."""
        notif = cls.objects.create(
            recipient=recipient,
            notification_type=notification_type,
            title=title,
            message=message,
            ticket=ticket,
        )
        # Push real-time via channel layer
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    f'notifications_{recipient.id}',
                    {
                        'type': 'send_notification',
                        'notification': {
                            'id': notif.id,
                            'notification_type': notif.notification_type,
                            'title': notif.title,
                            'message': notif.message,
                            'ticket_id': notif.ticket_id,
                            'ticket_stf_no': notif.ticket.stf_no if notif.ticket else None,
                            'is_read': notif.is_read,
                            'created_at': notif.created_at.isoformat(),
                        },
                    },
                )
        except Exception:
            pass  # Don't break if channel layer isn't available
        return notif
