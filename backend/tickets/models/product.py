from django.db import models
from .lookup import Category
from .client import Client


class Product(models.Model):
    """Global product/equipment catalog."""
    category = models.ForeignKey(
        Category, related_name='products', null=True, blank=True,
        on_delete=models.SET_NULL,
        help_text='Product category',
    )
    client = models.ForeignKey(
        Client, related_name='products', null=True, blank=True,
        on_delete=models.SET_NULL,
        help_text='Client that owns this product',
    )
    device_equipment = models.CharField(max_length=300, blank=True)
    version_no = models.CharField(max_length=100, blank=True)
    serial_no = models.CharField(max_length=200, blank=True)
    has_warranty = models.BooleanField(default=False)
    product_name = models.CharField(max_length=300, blank=True, help_text='Product name (optional)')
    brand = models.CharField(max_length=300, blank=True, help_text='Brand (optional)')
    model_name = models.CharField(max_length=300, blank=True, help_text='Model (optional)')
    sales_no = models.CharField(max_length=200, blank=True, help_text='Sales/invoice number')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    date_purchased = models.DateField(null=True, blank=True)
    others = models.TextField(blank=True, default='')
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        parts = [self.product_name, self.brand, self.model_name, self.serial_no]
        return ' / '.join(p for p in parts if p) or f'Product #{self.id}'
