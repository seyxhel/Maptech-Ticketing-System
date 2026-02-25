"""Merge migration to resolve conflicting leaf nodes 0006 and 0008."""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("tickets", "0006_remove_user_password_reset_expires_and_more"),
        ("tickets", "0008_remove_ticket_title"),
    ]

    operations = [
    ]
