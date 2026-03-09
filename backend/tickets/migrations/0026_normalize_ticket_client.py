"""
Migration 0026 – Normalize ticket → client relationship.

Phase 1 (data): For every Ticket that has flat client text but no client_record FK,
  create a Client record from that text and link it to the ticket.

Phase 2 (schema): Remove the 8 now-redundant flat client columns from tickets_ticket.
"""
from django.db import migrations, models


def create_client_records(apps, schema_editor):
    """Back-fill Client rows for any ticket that has raw text but no client_record."""
    Ticket = apps.get_model('tickets', 'Ticket')
    Client = apps.get_model('tickets', 'Client')

    for ticket in Ticket.objects.filter(client_record__isnull=True):
        client_name = (ticket.client or '').strip()
        # Only create a record if at least some identifying info exists
        if any([
            client_name,
            (ticket.contact_person or '').strip(),
            (ticket.mobile_no or '').strip(),
            (ticket.email_address or '').strip(),
        ]):
            new_client = Client.objects.create(
                client_name=client_name or 'Unknown',
                contact_person=ticket.contact_person or '',
                landline=ticket.landline or '',
                mobile_no=ticket.mobile_no or '',
                designation=ticket.designation or '',
                department_organization=ticket.department_organization or '',
                email_address=ticket.email_address or '',
                address=ticket.address or '',
            )
            ticket.client_record = new_client
            ticket.save(update_fields=['client_record'])


def reverse_create_client_records(apps, schema_editor):
    """Reverse: copy client_record data back to flat fields (best-effort)."""
    Ticket = apps.get_model('tickets', 'Ticket')
    for ticket in Ticket.objects.select_related('client_record').all():
        if ticket.client_record:
            cr = ticket.client_record
            ticket.client = cr.client_name
            ticket.contact_person = cr.contact_person
            ticket.landline = cr.landline
            ticket.mobile_no = cr.mobile_no
            ticket.designation = cr.designation
            ticket.department_organization = cr.department_organization
            ticket.email_address = cr.email_address
            ticket.address = cr.address
            ticket.save()


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0025_add_sales_no_to_ticket'),
    ]

    operations = [
        # ── Phase 1: back-fill Client records ──
        migrations.RunPython(
            create_client_records,
            reverse_code=reverse_create_client_records,
        ),

        # ── Phase 2: drop the flat client columns ──
        migrations.RemoveField(model_name='ticket', name='client'),
        migrations.RemoveField(model_name='ticket', name='contact_person'),
        migrations.RemoveField(model_name='ticket', name='address'),
        migrations.RemoveField(model_name='ticket', name='designation'),
        migrations.RemoveField(model_name='ticket', name='landline'),
        migrations.RemoveField(model_name='ticket', name='department_organization'),
        migrations.RemoveField(model_name='ticket', name='mobile_no'),
        migrations.RemoveField(model_name='ticket', name='email_address'),
    ]
