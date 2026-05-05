from django.core.management.base import BaseCommand
from tickets.models import TypeOfService


SEED_SERVICES = [
    {
        'name': 'Demo / POC',
        'description': 'Demonstration or Proof of Concept session to showcase product capabilities and validate solutions for client requirements.',
        'estimated_resolution_days': 1,
    },
    {
        'name': 'Repair / Service',
        'description': 'Troubleshooting, diagnosis, and repair of hardware or software issues to restore normal system operations.',
        'estimated_resolution_days': 3,
    },
    {
        'name': 'Ocular Inspection',
        'description': 'On-site physical inspection and assessment of equipment, infrastructure, or facilities before deployment or servicing.',
        'estimated_resolution_days': 2,
    },
    {
        'name': 'Installation',
        'description': 'Setup, configuration, and deployment of new hardware, software, or network infrastructure at the client site.',
        'estimated_resolution_days': 5,
    },
    {
        'name': 'Migration to HCI',
        'description': 'Migration of existing IT infrastructure to a Hyper-Converged Infrastructure platform for improved performance and scalability.',
        'estimated_resolution_days': 10,
    },
    {
        'name': 'Health Check',
        'description': 'Periodic system and infrastructure health checks, preventive maintenance, and basic diagnostics to ensure uptime and identify issues early.',
        'estimated_resolution_days': 1,
    },
]


class Command(BaseCommand):
    help = 'Seed the TypeOfService table with default service types.'

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0

        for data in SEED_SERVICES:
            service, created = TypeOfService.objects.update_or_create(
                name=data['name'],
                defaults={
                    'description': data['description'],
                    'is_active': True,
                    'estimated_resolution_days': data['estimated_resolution_days'],
                },
            )

            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created: {service.name}'))
            else:
                updated_count += 1
                self.stdout.write(self.style.WARNING(f'Updated: {service.name}'))

        self.stdout.write(
            self.style.SUCCESS(
                f'\nDone. {created_count} created, {updated_count} updated, {TypeOfService.objects.count()} total types of service.'
            )
        )
