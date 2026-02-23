from django.core.management.base import BaseCommand
from users.models import User


SEED_USERS = [
    {
        'username': 'ivo',
        'first_name': 'Rivo',
        'last_name': 'Vebayo',
        'email': 'rivovebayo@gmail.com',
        'password': 'RivoVebayo123!',
        'phone': '+639666666666',
        'role': User.ROLE_CLIENT,
        'is_agreed_privacy_policy': True,
    },
    {
        'username': 'seyxhel',
        'first_name': 'Sealtiel Joseph',
        'last_name': 'Pelagio',
        'email': 'sethpelagio20@gmail.com',
        'password': 'Oklangyan421!',
        'phone': '+639692221370',
        'role': User.ROLE_ADMIN,
        'is_staff': True,
        'is_superuser': True,
        'is_agreed_privacy_policy': True,
    },
    {
        'username': 'gerardquadra',
        'first_name': 'Gerard',
        'last_name': 'Quadra',
        'email': 'gerard.quadra@gmail.com',
        'password': 'GerardQuadra123!',
        'phone': '+639696969696',
        'role': User.ROLE_EMPLOYEE,
        'is_agreed_privacy_policy': True,
    },
]


class Command(BaseCommand):
    help = 'Seed the users_user table with default client, admin, and employee accounts.'

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
