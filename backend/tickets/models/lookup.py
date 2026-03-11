from django.db import models


class TypeOfService(models.Model):
    """Admin-managed lookup table for Type of Service dropdown."""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    estimated_resolution_days = models.PositiveIntegerField(
        default=0,
        help_text='Estimated number of days to resolve tickets of this service type (SLA basis)',
    )

    class Meta:
        verbose_name = 'Type of Service'
        verbose_name_plural = 'Types of Service'

    def __str__(self):
        return self.name


class Category(models.Model):
    """Admin-managed product category."""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name
