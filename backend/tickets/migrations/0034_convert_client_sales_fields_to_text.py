from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings
import json


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0033_add_client_sales_reps'),
    ]

    operations = [
        # Remove M2M additional_sales_reps
        migrations.RemoveField(
            model_name='client',
            name='additional_sales_reps',
        ),
        # Remove FK sales_representative
        migrations.RemoveField(
            model_name='client',
            name='sales_representative',
        ),
        # Add new sales_representative text field
        migrations.AddField(
            model_name='client',
            name='sales_representative',
            field=models.CharField(max_length=200, blank=True, default=''),
        ),
        # Add JSONField for additional_sales_reps if available, else TextField
        migrations.AddField(
            model_name='client',
            name='additional_sales_reps',
            field=models.JSONField(default=list, blank=True),
        ),
    ]
