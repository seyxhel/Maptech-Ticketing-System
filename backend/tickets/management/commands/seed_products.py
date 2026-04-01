from datetime import date

from django.core.management.base import BaseCommand

from tickets.models import Category, Product


SEED_PRODUCTS = [
    {
        "category_name": "Computer | Desktop | Laptop | Monitor",
        "product_name": "Latitude 5520",
        "brand": "Dell",
        "model_name": "5520",
        "device_equipment": "Laptop",
        "version_no": "v2.1",
        "serial_no": "DL5520-001",
        "sales_no": "INV-2026-001",
        "has_warranty": True,
        "date_purchased": date(2026, 1, 15),
    },
    {
        "category_name": "Closed-Circuit Television (CCTV)",
        "product_name": "Hikvision Dome Camera",
        "brand": "Hikvision",
        "model_name": "DS-2CD2143G2-I",
        "device_equipment": "CCTV Camera",
        "version_no": "FW 5.6",
        "serial_no": "HKCCTV-1023",
        "sales_no": "INV-2026-002",
        "has_warranty": True,
        "date_purchased": date(2025, 11, 22),
    },
    {
        "category_name": "Printing Devices & Consumables",
        "product_name": "EcoTank L3250",
        "brand": "Epson",
        "model_name": "L3250",
        "device_equipment": "Printer",
        "version_no": "FW 1.9",
        "serial_no": "EPSL3250-7788",
        "sales_no": "INV-2026-003",
        "has_warranty": False,
        "date_purchased": date(2025, 8, 7),
    },
    {
        "category_name": "Door Access",
        "product_name": "ProID40",
        "brand": "ZKTeco",
        "model_name": "ProID40",
        "device_equipment": "Door Access Controller",
        "version_no": "FW 6.60",
        "serial_no": "ZK-DA-4401",
        "sales_no": "INV-2026-004",
        "has_warranty": True,
        "date_purchased": date(2026, 2, 3),
    },
]


class Command(BaseCommand):
    help = "Seed the Product table with default products."

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0

        for data in SEED_PRODUCTS:
            category_name = data["category_name"]
            category = Category.objects.filter(name=category_name).first()

            defaults = {
                "category": category,
                "product_name": data["product_name"],
                "brand": data["brand"],
                "model_name": data["model_name"],
                "device_equipment": data["device_equipment"],
                "version_no": data["version_no"],
                "sales_no": data["sales_no"],
                "has_warranty": data["has_warranty"],
                "date_purchased": data["date_purchased"],
                "is_active": True,
            }

            product, created = Product.objects.update_or_create(
                serial_no=data["serial_no"],
                defaults=defaults,
            )

            label = product.product_name or product.device_equipment or product.serial_no
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"Created: {label}"))
            else:
                updated_count += 1
                self.stdout.write(self.style.WARNING(f"Updated: {label}"))

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. {created_count} created, {updated_count} updated, {Product.objects.count()} total products."
            )
        )
