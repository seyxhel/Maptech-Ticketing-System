from django.db import models


class Client(models.Model):
    """Client master data record."""
    client_name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=200, blank=True)
    landline = models.CharField(max_length=30, blank=True)
    mobile_no = models.CharField(max_length=20, blank=True)
    designation = models.CharField(max_length=200, blank=True)
    department_organization = models.CharField(max_length=200, blank=True)
    email_address = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['client_name']

    def __str__(self):
        return self.client_name
