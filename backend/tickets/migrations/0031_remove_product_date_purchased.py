from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0030_add_product_fields_to_ticket'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='product',
            name='date_purchased',
        ),
    ]
