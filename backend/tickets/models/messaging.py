from django.db import models
from django.conf import settings
from .ticket import Ticket


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
    assignment_session = models.ForeignKey(AssignmentSession, related_name='messages', on_delete=models.CASCADE, null=True, blank=True)
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
