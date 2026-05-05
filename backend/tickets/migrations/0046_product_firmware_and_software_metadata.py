from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0045_add_escalation_log_retention'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='firmware_version',
            field=models.CharField(blank=True, default='', max_length=120),
        ),
        migrations.AddField(
            model_name='product',
            name='software_license_key',
            field=models.CharField(blank=True, default='', max_length=300),
        ),
        migrations.AddField(
            model_name='product',
            name='software_metadata',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='product',
            name='software_name',
            field=models.CharField(blank=True, default='', max_length=300),
        ),
        migrations.AddField(
            model_name='product',
            name='software_vendor',
            field=models.CharField(blank=True, default='', max_length=300),
        ),
        migrations.AddField(
            model_name='product',
            name='software_version',
            field=models.CharField(blank=True, default='', max_length=120),
        ),
    ]
