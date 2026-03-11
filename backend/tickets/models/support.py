from django.db import models
from django.conf import settings
from .ticket import Ticket


class CallLog(models.Model):
    """Records each call made by admin to a client during ticket creation."""
    ticket = models.ForeignKey(Ticket, null=True, blank=True, on_delete=models.SET_NULL, related_name='call_logs')
    admin = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='call_logs', on_delete=models.CASCADE)
    client_name = models.CharField(max_length=200, blank=True)
    phone_number = models.CharField(max_length=30, blank=True)
    call_start = models.DateTimeField(help_text='When the call started')
    call_end = models.DateTimeField(null=True, blank=True, help_text='When the call ended')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-call_start']

    @property
    def duration_seconds(self):
        if self.call_start and self.call_end:
            return (self.call_end - self.call_start).total_seconds()
        return None

    def __str__(self):
        return f"Call #{self.id} by {self.admin.username} at {self.call_start}"


class CSATFeedback(models.Model):
    """Admin feedback on employee performance before closing a ticket."""
    RATING_CHOICES = [
        (1, 'Very Poor'),
        (2, 'Poor'),
        (3, 'Average'),
        (4, 'Good'),
        (5, 'Excellent'),
    ]

    ticket = models.OneToOneField(Ticket, on_delete=models.CASCADE, related_name='csat_feedback')
    employee = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='csat_received', on_delete=models.CASCADE)
    admin = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='csat_given', on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES)
    comments = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'CSAT Feedback'
        verbose_name_plural = 'CSAT Feedbacks'

    def __str__(self):
        return f"CSAT for {self.ticket.stf_no}: {self.rating}/5 by {self.admin.username}"
