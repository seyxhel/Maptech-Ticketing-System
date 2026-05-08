from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0048_service_report_sr_no'),
    ]

    operations = [
        migrations.CreateModel(
            name='ServiceReportAttachment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file', models.FileField(upload_to='service_reports/%Y/%m/%d/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('service_report', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attachments', to='tickets.servicereport')),
            ],
            options={
                'ordering': ['created_at', 'id'],
            },
        ),
    ]
