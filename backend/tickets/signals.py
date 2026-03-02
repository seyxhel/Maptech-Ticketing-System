from django.db.models.signals import post_migrate, post_save, post_delete
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.dispatch import receiver
from django.contrib.auth import get_user_model


@receiver(post_migrate)
def create_initial_admin(sender, **kwargs):
    User = get_user_model()
    if sender.name != 'tickets':
        return
    try:
        # Create default admin (is_staff=True, is_superuser=False)
        if not User.objects.filter(email='rvebayo@gmail.com').exists():
            user = User.objects.create_user(
                username='Rivo Vebayo',
                email='rvebayo@gmail.com',
                password='rvebayo123!',
                role=User.ROLE_ADMIN,
                is_staff=True,
                is_superuser=False,
            )
    except Exception:
        # avoid failing migrations if DB not ready
        pass


# ── Audit logging signals ──

@receiver(user_logged_in)
def audit_user_login(sender, request, user, **kwargs):
    """Log user login events."""
    try:
        from .models import AuditLog
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = x_forwarded_for.split(',')[0].strip() if x_forwarded_for else request.META.get('REMOTE_ADDR')
        AuditLog.log(
            entity=AuditLog.ENTITY_USER,
            entity_id=user.id,
            action=AuditLog.ACTION_LOGIN,
            activity=f"{user.email} logged in via {request.META.get('HTTP_USER_AGENT', 'Unknown')[:80]}",
            actor=user,
            ip_address=ip,
        )
    except Exception:
        pass


@receiver(user_logged_out)
def audit_user_logout(sender, request, user, **kwargs):
    """Log user logout events."""
    try:
        from .models import AuditLog
        if user:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            ip = x_forwarded_for.split(',')[0].strip() if x_forwarded_for else request.META.get('REMOTE_ADDR')
            AuditLog.log(
                entity=AuditLog.ENTITY_USER,
                entity_id=user.id,
                action=AuditLog.ACTION_LOGOUT,
                activity=f"{user.email} logged out",
                actor=user,
                ip_address=ip,
            )
    except Exception:
        pass


@receiver(post_save, sender='users.User')
def audit_user_save(sender, instance, created, **kwargs):
    """Log user creation and updates."""
    try:
        from .models import AuditLog
        if created:
            AuditLog.log(
                entity=AuditLog.ENTITY_USER,
                entity_id=instance.id,
                action=AuditLog.ACTION_CREATE,
                activity=f"{instance.email} account created with role {instance.role}",
                actor=None,  # May not have request context in signal
            )
    except Exception:
        pass
