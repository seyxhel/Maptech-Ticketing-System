from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0032_remove_product_others'),
    ]

    operations = [
        migrations.AddField(
            model_name='client',
            name='sales_representative',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='clients_primary', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='client',
            name='additional_sales_reps',
            field=models.ManyToManyField(blank=True, related_name='clients_additional', to=settings.AUTH_USER_MODEL),
        ),
    ]
