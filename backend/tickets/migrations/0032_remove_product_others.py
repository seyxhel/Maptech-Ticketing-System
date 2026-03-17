from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0031_remove_product_date_purchased'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='product',
            name='others',
        ),
    ]
