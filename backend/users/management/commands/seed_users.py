from django.core.management.base import BaseCommand
from users.models import User


SEED_USERS = [
    {
        'username': 'SuperAdmin',
        'first_name': 'Super',
        'last_name': 'Admin',
        'email': 'superadmin@maptechisi.com',
        'password': 'Superadmin123!',
        'role': User.ROLE_SUPERADMIN,
        'is_staff': True,       # superadmin: is_staff=True, is_superuser=True
        'is_superuser': True,
    },
    {
        'username': 'Employee',
        'first_name': 'Employee',
        'last_name': 'User',
        'email': 'employee@maptechisi.com',
        'password': 'Employee123!',
        'role': User.ROLE_EMPLOYEE,
    },
]


class Command(BaseCommand):
    help = 'Seed the users_user table with default admin and employee accounts.'

    def handle(self, *args, **options):
        for data in SEED_USERS:
            password = data.pop('password')
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults=data,
            )
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(self.style.SUCCESS(f'Created {user.role} user: {user.username}'))
            else:
                self.stdout.write(self.style.WARNING(f'User already exists: {user.username}'))
            # Re-add password key for idempotency
            data['password'] = password
