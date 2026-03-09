"""
Migration 0027 – Normalize product data out of tickets_ticket.

Phase 1 (data): For each Ticket that has product data in its flat fields but
                no product_record FK yet, create a Product row from those flat
                fields and link it.
Phase 2 (schema): Drop the 9 now-redundant flat product columns.
"""
from django.db import migrations, models


def backfill_product_records(apps, schema_editor):
    """Create Product records from flat product fields for tickets that lack one."""
    Ticket = apps.get_model('tickets', 'Ticket')
    Product = apps.get_model('tickets', 'Product')

    for ticket in Ticket.objects.filter(product_record__isnull=True):
        product_name = getattr(ticket, 'product', '') or ''
        brand = getattr(ticket, 'brand', '') or ''
        model_name = getattr(ticket, 'model_name', '') or ''
        device_equipment = getattr(ticket, 'device_equipment', '') or ''
        version_no = getattr(ticket, 'version_no', '') or ''
        serial_no = getattr(ticket, 'serial_no', '') or ''
        sales_no = getattr(ticket, 'sales_no', '') or ''
        has_warranty = getattr(ticket, 'has_warranty', False) or False
        date_purchased = getattr(ticket, 'date_purchased', None)

        has_data = any([
            product_name, brand, model_name, device_equipment,
            version_no, serial_no, sales_no, has_warranty, date_purchased,
        ])
        if not has_data:
            continue

        product = Product.objects.create(
            product_name=product_name,
            brand=brand,
            model_name=model_name,
            device_equipment=device_equipment,
            version_no=version_no,
            serial_no=serial_no,
            sales_no=sales_no,
            has_warranty=has_warranty,
            date_purchased=date_purchased,
        )
        ticket.product_record = product
        ticket.save()


def reverse_backfill(apps, schema_editor):
    """No-op reverse – data migration is not reversible."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0026_normalize_ticket_client'),
    ]

    operations = [
        # ── Phase 1: back-fill product_record FK ──────────────────────
        migrations.RunPython(backfill_product_records, reverse_code=reverse_backfill),

        # ── Phase 2: drop the 9 flat product columns ──────────────────
        migrations.RemoveField(model_name='ticket', name='has_warranty'),
        migrations.RemoveField(model_name='ticket', name='product'),
        migrations.RemoveField(model_name='ticket', name='brand'),
        migrations.RemoveField(model_name='ticket', name='model_name'),
        migrations.RemoveField(model_name='ticket', name='device_equipment'),
        migrations.RemoveField(model_name='ticket', name='version_no'),
        migrations.RemoveField(model_name='ticket', name='date_purchased'),
        migrations.RemoveField(model_name='ticket', name='serial_no'),
        migrations.RemoveField(model_name='ticket', name='sales_no'),
    ]
