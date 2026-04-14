from django.db import models
from django.conf import settings


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
    # Primary sales representative stored as free text (optional)
    sales_representative = models.CharField(max_length=200, blank=True)
    # Optional additional sales representatives stored as a JSON list of names.
    additional_sales_reps = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['client_name']

    def __str__(self):
        return self.client_name
