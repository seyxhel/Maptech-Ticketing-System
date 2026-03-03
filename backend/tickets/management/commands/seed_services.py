from django.core.management.base import BaseCommand
from tickets.models import TypeOfService


SEED_SERVICES = [
    {
        'name': 'Demo / POC',
        'description': 'Demonstration or Proof of Concept session to showcase product capabilities and validate solutions for client requirements.',
    },
    {
        'name': 'Repair / Service',
        'description': 'Troubleshooting, diagnosis, and repair of hardware or software issues to restore normal system operations.',
    },
    {
        'name': 'Ocular Inspection',
        'description': 'On-site physical inspection and assessment of equipment, infrastructure, or facilities before deployment or servicing.',
    },
    {
        'name': 'Installation',
        'description': 'Setup, configuration, and deployment of new hardware, software, or network infrastructure at the client site.',
    },
    {
        'name': 'Migration to HCI',
        'description': 'Migration of existing IT infrastructure to a Hyper-Converged Infrastructure platform for improved performance and scalability.',
    },
]


class Command(BaseCommand):
    help = 'Seed the TypeOfService table with default service types.'

    def handle(self, *args, **options):
        for data in SEED_SERVICES:
            service, created = TypeOfService.objects.get_or_create(
                name=data['name'],
                defaults={'description': data['description'], 'is_active': True},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created: {service.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Already exists: {service.name}'))

        self.stdout.write(self.style.SUCCESS(f'\nDone — {TypeOfService.objects.count()} total types of service.'))
