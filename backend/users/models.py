import uuid

from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser


def _generate_recovery_key():
    """Generate a unique recovery key in the format xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx."""
    raw = uuid.uuid4().hex + uuid.uuid4().hex  # 64 hex chars
    return '-'.join(raw[i:i+4] for i in range(0, 32, 4))  # 8 groups of 4


class User(AbstractUser):
    ROLE_EMPLOYEE = 'employee'
    ROLE_ADMIN = 'admin'
    ROLE_SUPERADMIN = 'superadmin'
    ROLE_CHOICES = [
        (ROLE_EMPLOYEE, 'Employee'),
        (ROLE_ADMIN, 'Admin'),
        (ROLE_SUPERADMIN, 'Superadmin'),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=12, choices=ROLE_CHOICES, default=ROLE_EMPLOYEE)
    middle_name = models.CharField(max_length=150, blank=True)
    suffix = models.CharField(max_length=3, blank=True)
    phone = models.CharField(max_length=13, blank=True)
    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        null=True,
        blank=True,
        help_text='User profile picture',
    )
    recovery_key = models.CharField(
        max_length=39,
        unique=True,
        blank=True,
        help_text='Unique recovery key for password reset (xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx)',
    )

    def save(self, *args, **kwargs):
        if not self.recovery_key:
            self.recovery_key = _generate_recovery_key()
        super().save(*args, **kwargs)

    @property
    def is_admin_level(self):
        """Returns True for both admin and superadmin roles."""
        return self.role in (self.ROLE_ADMIN, self.ROLE_SUPERADMIN)

    def __str__(self):
        return f"{self.username} ({self.role})"