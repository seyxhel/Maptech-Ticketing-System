from django.db.models.signals import post_migrate
from django.dispatch import receiver
from django.contrib.auth import get_user_model


@receiver(post_migrate)
def create_initial_admin(sender, **kwargs):
    User = get_user_model()
    if sender.name != 'tickets':
        return
    try:
        # Create default admin (is_staff=True, is_superuser=False)
        if not User.objects.filter(email='admin@gmail.com').exists():
            user = User.objects.create_user(
                username='admin',
                email='admin@gmail.com',
                password='admin',
                role=User.ROLE_ADMIN,
                is_staff=True,
                is_superuser=False,
            )
    except Exception:
        # avoid failing migrations if DB not ready
        pass
