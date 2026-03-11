from django.db import models
from django.conf import settings
from django.utils import timezone


class RetentionPolicy(models.Model):
    """Configurable retention periods for audit logs and call logs.
    Only one row should exist (singleton). Use RetentionPolicy.get_policy() to access.
    """
    audit_log_retention_days = models.PositiveIntegerField(
        default=365,
        help_text='Number of days to retain audit logs. 0 means keep forever.',
    )
    call_log_retention_days = models.PositiveIntegerField(
        default=365,
        help_text='Number of days to retain call logs. 0 means keep forever.',
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='+',
    )

    class Meta:
        verbose_name = 'Retention Policy'
        verbose_name_plural = 'Retention Policies'

    def __str__(self):
        return f"Retention Policy (Audit: {self.audit_log_retention_days}d, Call: {self.call_log_retention_days}d)"

    def save(self, *args, **kwargs):
        # Enforce singleton: always use pk=1
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_policy(cls):
        """Return the singleton policy, creating it with defaults if it doesn't exist."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Announcement(models.Model):
    ANNOUNCEMENT_TYPE_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('success', 'Success'),
        ('critical', 'Critical'),
    ]
    VISIBILITY_CHOICES = [
        ('all', 'All (Supervisors & Technicians)'),
        ('admin', 'Supervisors Only'),
        ('employee', 'Technicians Only'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    announcement_type = models.CharField(max_length=20, choices=ANNOUNCEMENT_TYPE_CHOICES, default='info')
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='all')
    is_active = models.BooleanField(default=True)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True, help_text='Leave blank for no expiry.')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='announcements_created',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.get_announcement_type_display()}] {self.title}"

    @property
    def is_currently_active(self):
        now = timezone.now()
        if not self.is_active:
            return False
        if self.start_date and now < self.start_date:
            return False
        if self.end_date and now > self.end_date:
            return False
        return True
