import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import User
from tickets.models import Ticket, TypeOfService, Client


# ── Realistic ticket data ────────────────────────────────────────────
SEED_TICKETS = [
    {
        'client_name': 'Doe Enterprises',
        'contact_person': 'John Doe',
        'address': '123 Main St., Sample City',
        'designation': 'IT Manager',
        'department_organization': 'IT Department',
        'landline': '(02) 8000-1111',
        'mobile_no': '09170000001',
        'email_address': 'john.doe@example.com',
        'preferred_support_type': Ticket.SUPPORT_ONSITE,
        'description_of_problem': 'Network switch in server room is dropping connections intermittently, affecting all office computers. Issue started after last power outage.',
        'service_name': 'Repair / Service',
    },
    {
        'client_name': 'Williams & Associates',
        'contact_person': 'Jessica Williams',
        'address': '456 Oak Ave., Test Town',
        'designation': 'Operations Head',
        'department_organization': 'Operations',
        'landline': '(02) 8000-2222',
        'mobile_no': '09170000002',
        'email_address': 'jessica.williams@example.com',
        'preferred_support_type': Ticket.SUPPORT_REMOTE,
        'description_of_problem': 'Need to migrate existing VMware infrastructure to HCI platform. Currently running 3 physical hosts with approximately 25 VMs.',
        'service_name': 'Migration to HCI',
    },
    {
        'client_name': 'Smith Medical Clinic',
        'contact_person': 'Robert Smith',
        'address': '789 Elm Rd., Demo Village',
        'designation': 'Chief Information Officer',
        'department_organization': 'Health Information System',
        'landline': '(02) 8000-3333',
        'mobile_no': '09170000003',
        'email_address': 'robert.smith@example.com',
        'preferred_support_type': Ticket.SUPPORT_ONSITE,
        'description_of_problem': 'Installing new Cisco Catalyst 9300 switches across 3 floors. Need structured cabling review and configuration for VLAN segmentation.',
        'service_name': 'Installation',
    },
    {
        'client_name': 'Brown Publishing Co.',
        'contact_person': 'Emily Brown',
        'address': '321 Pine St., Placeholder City',
        'designation': 'Systems Administrator',
        'department_organization': 'Technical Operations',
        'landline': '(02) 8000-4444',
        'mobile_no': '09170000004',
        'email_address': 'emily.brown@example.com',
        'preferred_support_type': Ticket.SUPPORT_CHAT,
        'description_of_problem': 'Firewall appliance showing high CPU usage and SSL-VPN sessions timing out. Suspected firmware bug after recent update.',
        'service_name': 'Repair / Service',
    },
    {
        'client_name': 'Johnson Logistics Inc.',
        'contact_person': 'Michael Johnson',
        'address': '654 Maple Blvd., Mockup Town',
        'designation': 'Procurement Head',
        'department_organization': 'Procurement & Logistics',
        'landline': '(02) 8000-5555',
        'mobile_no': '09170000005',
        'email_address': 'michael.johnson@example.com',
        'preferred_support_type': Ticket.SUPPORT_ONSITE,
        'description_of_problem': 'Requesting ocular inspection for proposed CCTV system with 60 cameras across the main compound. Need site survey for cable routing and server room assessment.',
        'service_name': 'Ocular Inspection',
    },
]


class Command(BaseCommand):
    help = 'Seed 5 sample tickets randomly assigned to seeded employees.'

    def handle(self, *args, **options):
        # Grab the admin user to act as ticket creator
        admin = User.objects.filter(role__in=[User.ROLE_ADMIN, User.ROLE_SUPERADMIN]).first()
        if not admin:
            self.stderr.write(self.style.ERROR(
                'No admin/superadmin user found. Run "python manage.py seed_users" first.'
            ))
            return

        # Grab employees
        employees = list(User.objects.filter(role=User.ROLE_EMPLOYEE))
        if len(employees) < 1:
            self.stderr.write(self.style.ERROR(
                'No employee users found. Run "python manage.py seed_users" first.'
            ))
            return

        self.stdout.write(f'Found {len(employees)} employee(s): '
                          + ', '.join(e.username for e in employees))

        created_count = 0
        for i, data in enumerate(SEED_TICKETS):
            service_name = data.pop('service_name')

            # Look up the TypeOfService (must seed_services first)
            service = TypeOfService.objects.filter(name=service_name).first()

            # Pick a random employee
            employee = random.choice(employees)

            # Extract client fields from seed data
            client_fields = {
                'client_name':             data.pop('client_name', 'Unknown'),
                'contact_person':          data.pop('contact_person', ''),
                'address':                 data.pop('address', ''),
                'designation':             data.pop('designation', ''),
                'department_organization': data.pop('department_organization', ''),
                'landline':                data.pop('landline', ''),
                'mobile_no':               data.pop('mobile_no', ''),
                'email_address':           data.pop('email_address', ''),
            }

            # Check if a ticket with this client name + description already exists (idempotent)
            existing = Ticket.objects.filter(
                client_record__client_name=client_fields['client_name'],
                description_of_problem=data['description_of_problem'],
            ).first()

            if existing:
                self.stdout.write(self.style.WARNING(
                    f'Ticket already exists: {existing.stf_no} — {client_fields["client_name"]}'
                ))
                # Re-add popped key for idempotency
                data['service_name'] = service_name
                continue

            # Get or create the Client record
            client_record, _ = Client.objects.get_or_create(
                client_name=client_fields['client_name'],
                defaults={
                    'contact_person':          client_fields['contact_person'],
                    'address':                 client_fields['address'],
                    'designation':             client_fields['designation'],
                    'department_organization': client_fields['department_organization'],
                    'landline':                client_fields['landline'],
                    'mobile_no':               client_fields['mobile_no'],
                    'email_address':           client_fields['email_address'],
                },
            )

            ticket = Ticket.objects.create(
                created_by=admin,
                assigned_to=employee,
                status=Ticket.STATUS_IN_PROGRESS,
                type_of_service=service,
                priority=random.choice([
                    Ticket.PRIORITY_LOW,
                    Ticket.PRIORITY_MEDIUM,
                    Ticket.PRIORITY_HIGH,
                    Ticket.PRIORITY_CRITICAL,
                ]),
                confirmed_by_admin=True,
                date=timezone.now().date(),
                client_record=client_record,
                **data,
            )

            created_count += 1
            self.stdout.write(self.style.SUCCESS(
                f'[{created_count}] Created ticket {ticket.stf_no} '
                f'— "{client_fields["client_name"]}" → assigned to {employee.username}'
            ))

            # Re-add popped key for idempotency
            data['service_name'] = service_name

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. {created_count} ticket(s) created.'
        ))
