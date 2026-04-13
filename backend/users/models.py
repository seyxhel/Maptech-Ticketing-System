import uuid
import secrets

from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.hashers import make_password, check_password


def _generate_recovery_key():
    """Generate a unique recovery key in the format xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx."""
    raw = uuid.uuid4().hex + uuid.uuid4().hex  # 64 hex chars
    return '-'.join(raw[i:i+4] for i in range(0, 32, 4))  # 8 groups of 4


class User(AbstractUser):
    ROLE_EMPLOYEE = 'employee'
    ROLE_SALES = 'sales'
    ROLE_ADMIN = 'admin'
    ROLE_SUPERADMIN = 'superadmin'
    ROLE_CHOICES = [
        (ROLE_EMPLOYEE, 'Technical Staff'),
        (ROLE_SALES, 'Sales'),
        (ROLE_ADMIN, 'Supervisor'),
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
        max_length=255,
        db_index=True,
        blank=True,
        help_text='Hashed recovery key for password reset verification.',
    )

    @staticmethod
    def generate_recovery_key() -> str:
        return _generate_recovery_key()

    @staticmethod
    def hash_recovery_key(raw_key: str) -> str:
        return make_password(raw_key, hasher='pbkdf2_sha256')

    def set_recovery_key(self, raw_key: str) -> None:
        self.recovery_key = self.hash_recovery_key(raw_key)

    def check_recovery_key(self, raw_key: str) -> bool:
        """Validate a provided recovery key against hashed storage.

        Falls back to constant-time plaintext comparison for legacy rows
        that have not yet been migrated.
        """
        key = (self.recovery_key or '').strip()
        if not key:
            return False
        if '$' in key:
            return check_password(raw_key, key)
        return secrets.compare_digest(key, raw_key)

    def save(self, *args, **kwargs):
        if not self.recovery_key:
            plain_key = self.generate_recovery_key()
            self.set_recovery_key(plain_key)
            self._plain_recovery_key = plain_key
        elif '$' not in self.recovery_key:
            # Legacy plaintext key support during transition.
            self.set_recovery_key(self.recovery_key)
        super().save(*args, **kwargs)

    @property
    def is_admin_level(self):
        """Returns True for admin-level roles."""
        return self.role in (self.ROLE_SALES, self.ROLE_ADMIN, self.ROLE_SUPERADMIN)

    def __str__(self):
        return f"{self.username} ({self.role})"