from django.db import models
from django.conf import settings
from .ticket import Ticket


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
