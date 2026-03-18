from django.core.management.base import BaseCommand
from tickets.models import Category, Product


SEED_PRODUCTS = [
    # Wireless Access Points & Switches
    {
        'category_name': 'Wireless Access Points & Switches',
        'product_name': 'UniFi AP AC Pro',
        'brand': 'Ubiquiti',
        'model_name': 'UAP-AC-PRO',
        'device_equipment': 'Wireless Access Point',
        'version_no': 'Firmware 6.0.23',
        'serial_no': 'UAP-PRO-300003',
        'sales_no': 'SO-2025-003',
        'has_warranty': True,
        
    },
    {
        'category_name': 'Wireless Access Points & Switches',
        'product_name': 'Cisco Catalyst 9300',
        'brand': 'Cisco',
        'model_name': 'C9300-48P',
        'device_equipment': 'Network Switch',
        'version_no': 'IOS-XE 17.9.3',
        'serial_no': 'CSCO-9300-400004',
        'sales_no': 'SO-2025-004',
        'has_warranty': True,
        
    },
    # CCTV
    {
        'category_name': 'Closed-Circuit Television (CCTV)',
        'product_name': 'DS-2CD2143G2-I',
        'brand': 'Hikvision',
        'model_name': 'DS-2CD2143G2-I',
        'device_equipment': 'IP Dome Camera (4MP)',
        'version_no': 'V5.7.15',
        'serial_no': 'HVS-CAM-500005',
        'sales_no': 'SO-2025-005',
        'has_warranty': True,
        
    },
    {
        'category_name': 'Closed-Circuit Television (CCTV)',
        'product_name': 'DS-7608NI-Q2',
        'brand': 'Hikvision',
        'model_name': 'DS-7608NI-Q2/8P',
        'device_equipment': 'Network Video Recorder (8-Ch)',
        'version_no': 'V4.62.015',
        'serial_no': 'HVS-NVR-600006',
        'sales_no': 'SO-2025-006',
        'has_warranty': True,
        
    },
    # Computer | Desktop | Laptop | Monitor
    {
        'category_name': 'Computer | Desktop | Laptop | Monitor',
        'product_name': 'ThinkPad X1 Carbon Gen 11',
        'brand': 'Lenovo',
        'model_name': 'X1 Carbon Gen 11',
        'device_equipment': 'Laptop',
        'version_no': 'BIOS N40ET36W',
        'serial_no': 'LNV-X1C-700007',
        'sales_no': 'SO-2025-007',
        'has_warranty': True,
        
    },
    {
        'category_name': 'Computer | Desktop | Laptop | Monitor',
        'product_name': 'OptiPlex 7010',
        'brand': 'Dell',
        'model_name': 'OptiPlex 7010 SFF',
        'device_equipment': 'Desktop PC',
        'version_no': 'BIOS 1.14.0',
        'serial_no': 'DELL-OP7-800008',
        'sales_no': 'SO-2025-008',
        'has_warranty': False,
        
    },
    # UPS
    {
        'category_name': 'Uninterruptible Power Supply (UPS)',
        'product_name': 'Smart-UPS 1500VA',
        'brand': 'APC',
        'model_name': 'SMT1500RM2UC',
        'device_equipment': 'UPS (Rack Mount)',
        'version_no': 'UPS 08.9',
        'serial_no': 'APC-SMT-900009',
        'sales_no': 'SO-2025-009',
        'has_warranty': True,
        
    },
    # Storage and Servers
    {
        'category_name': 'Storage and Servers',
        'product_name': 'ProLiant DL380 Gen10',
        'brand': 'HPE',
        'model_name': 'DL380 Gen10',
        'device_equipment': 'Rack Server',
        'version_no': 'iLO 5 v2.78',
        'serial_no': 'HPE-DL380-101010',
        'sales_no': 'SO-2025-010',
        'has_warranty': True,
        
    },
    # Biometrics
    {
        'category_name': 'Biometrics',
        'product_name': 'ZK-K40',
        'brand': 'ZKTeco',
        'model_name': 'K40',
        'device_equipment': 'Fingerprint Time & Attendance Terminal',
        'version_no': 'FW 6.60',
        'serial_no': 'ZKT-K40-111111',
        'sales_no': 'SO-2025-011',
        'has_warranty': True,
        
    },
    # Door Access
    {
        'category_name': 'Door Access',
        'product_name': 'Z-Wave Smart Lock',
        'brand': 'Yale',
        'model_name': 'YDM4109',
        'device_equipment': 'Electronic Door Lock',
        'version_no': 'FW 2.1',
        'serial_no': 'YALE-YDM-121212',
        'sales_no': 'SO-2025-012',
        'has_warranty': False,
        
    },
    # Printing Devices
    {
        'category_name': 'Printing Devices & Consumables',
        'product_name': 'LaserJet Pro M404n',
        'brand': 'HP',
        'model_name': 'M404n',
        'device_equipment': 'Monochrome Laser Printer',
        'version_no': 'FW 2410411_000590',
        'serial_no': 'HP-M404-131313',
        'sales_no': 'SO-2025-013',
        'has_warranty': True,
        
    },
    # Telephony Solution
    {
        'category_name': 'Telephony Solution',
        'product_name': 'IP Phone 8845',
        'brand': 'Cisco',
        'model_name': 'CP-8845',
        'device_equipment': 'VoIP Desktop Phone',
        'version_no': 'SIP 14.1.1',
        'serial_no': 'CSCO-IP88-141414',
        'sales_no': 'SO-2025-014',
        'has_warranty': True,
    },
    # Video Conferencing
    {
        'category_name': 'Video Conferencing',
        'product_name': 'Teams Room Kit',
        'brand': 'Logitech',
        'model_name': 'Rally Plus',
        'device_equipment': 'Video Conferencing System',
        'version_no': 'FW 1.10.159',
        'serial_no': 'LOGI-RLY-151515',
        'sales_no': 'SO-2025-015',
        'has_warranty': True,
    },
]


class Command(BaseCommand):
    help = 'Seed sample products into the Product catalog.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all existing products before seeding.',
        )

    def handle(self, *args, **options):
        if options['clear']:
            deleted, _ = Product.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'Cleared {deleted} existing product(s).'))

        created_count = 0
        skipped_count = 0

        for data in SEED_PRODUCTS:
            category_name = data.pop('category_name')
            date_purchased = data.pop('date_purchased', None)

            # Resolve category: create it if it doesn't exist (make seeding idempotent on deployments)
            category, cat_created = Category.objects.get_or_create(name=category_name)
            if cat_created:
                self.stdout.write(
                    self.style.WARNING(
                        f'  Category "{category_name}" not found — created new Category.'
                    )
                )

            # Parse date
            from datetime import date
            parsed_date = None
            if date_purchased:
                try:
                    parsed_date = date.fromisoformat(date_purchased)
                except ValueError:
                    self.stdout.write(
                        self.style.WARNING(f'  Invalid date "{date_purchased}" — skipping date.')
                    )

            # Skip duplicates by serial_no (if provided)
            serial_no = data.get('serial_no', '')
            if serial_no and Product.objects.filter(serial_no=serial_no).exists():
                self.stdout.write(
                    self.style.NOTICE(f'  Skipped (already exists): {data.get("product_name")} [{serial_no}]')
                )
                skipped_count += 1
                continue

            Product.objects.create(
                category=category,
                date_purchased=parsed_date,
                **data,
            )
            self.stdout.write(
                self.style.SUCCESS(f'  Created: {data.get("product_name")} [{serial_no}]')
            )
            created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\nDone. {created_count} product(s) created, {skipped_count} skipped.'
            )
        )
