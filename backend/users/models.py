from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_CLIENT = 'client'
    ROLE_EMPLOYEE = 'employee'
    ROLE_ADMIN = 'admin'
    ROLE_SUPERADMIN = 'superadmin'
    ROLE_CHOICES = [
        (ROLE_CLIENT, 'Client'),
        (ROLE_EMPLOYEE, 'Employee'),
        (ROLE_ADMIN, 'Admin'),
        (ROLE_SUPERADMIN, 'Superadmin'),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=12, choices=ROLE_CHOICES, default=ROLE_CLIENT)
    middle_name = models.CharField(max_length=150, blank=True)
    suffix = models.CharField(max_length=3, blank=True)
    phone = models.CharField(max_length=13, blank=True)
    is_agreed_privacy_policy = models.BooleanField(default=False)

    @property
    def is_admin_level(self):
        """Returns True for both admin and superadmin roles."""
        return self.role in (self.ROLE_ADMIN, self.ROLE_SUPERADMIN)

    def __str__(self):
        return f"{self.username} ({self.role})"