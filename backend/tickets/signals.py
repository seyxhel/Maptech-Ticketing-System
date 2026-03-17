from django.db.models.signals import post_migrate, post_save, post_delete, pre_save
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
        if not User.objects.filter(email='admin@maptechisi.com').exists():
            user = User.objects.create_user(
                username='Admin',
                first_name='Admin',
                last_name='User',
                email='admin@maptechisi.com',
                password='Admin123!',
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


# ── Notification signals ──

@receiver(post_save, sender='tickets.Ticket')
def notify_ticket_changes(sender, instance, created, **kwargs):
    """Generate notifications when tickets are created or significant fields change."""
    try:
        from .models import Notification, Ticket
        User = get_user_model()

        if created:
            # Notify all admins/superadmins about new ticket
            admin_users = User.objects.filter(
                role__in=[User.ROLE_ADMIN, User.ROLE_SUPERADMIN],
                is_active=True,
            ).exclude(id=instance.created_by_id)
            for admin_user in admin_users:
                Notification.notify(
                    recipient=admin_user,
                    notification_type=Notification.TYPE_NEW_TICKET,
                    title='New Ticket Created',
                    message=f'Ticket {instance.stf_no} has been created by {instance.created_by.username}.',
                    ticket=instance,
                )
    except Exception:
        pass


@receiver(pre_save, sender='tickets.Ticket')
def capture_ticket_old_values(sender, instance, **kwargs):
    """Capture old values before save for notification comparison."""
    if instance.pk:
        try:
            from .models import Ticket
            old = Ticket.objects.filter(pk=instance.pk).values(
                'assigned_to_id', 'status'
            ).first()
            instance._old_assigned_to_id = old['assigned_to_id'] if old else None
            instance._old_status = old['status'] if old else None
        except Exception:
            instance._old_assigned_to_id = None
            instance._old_status = None
    else:
        instance._old_assigned_to_id = None
        instance._old_status = None


@receiver(post_save, sender='tickets.Ticket')
def notify_ticket_assignment_and_status(sender, instance, created, **kwargs):
    """Notify on assignment changes and status changes."""
    if created:
        return  # Handled by notify_ticket_changes above
    try:
        from .models import Notification
        User = get_user_model()

        old_assigned = getattr(instance, '_old_assigned_to_id', None)
        old_status = getattr(instance, '_old_status', None)

        # ── Assignment notification ──
        if instance.assigned_to_id and instance.assigned_to_id != old_assigned:
            Notification.notify(
                recipient=instance.assigned_to,
                notification_type=Notification.TYPE_ASSIGNMENT,
                title='Ticket Assigned to You',
                message=f'You have been assigned to ticket {instance.stf_no}.',
                ticket=instance,
            )

        # ── Status change notifications ──
        if old_status and instance.status != old_status:
            # Notify the ticket creator
            if instance.created_by_id:
                Notification.notify(
                    recipient=instance.created_by,
                    notification_type=Notification.TYPE_STATUS_CHANGE,
                    title='Ticket Status Updated',
                    message=f'Ticket {instance.stf_no} status changed from {old_status} to {instance.status}.',
                    ticket=instance,
                )

            # If escalated, notify all admins
            if instance.status in ('escalated', 'escalated_external'):
                admin_users = User.objects.filter(
                    role__in=[User.ROLE_ADMIN, User.ROLE_SUPERADMIN],
                    is_active=True,
                )
                for admin_user in admin_users:
                    Notification.notify(
                        recipient=admin_user,
                        notification_type=Notification.TYPE_ESCALATION,
                        title='Ticket Escalated',
                        message=f'Ticket {instance.stf_no} has been escalated.',
                        ticket=instance,
                    )

            # If pending closure, notify admins
            if instance.status == 'pending_closure':
                admin_users = User.objects.filter(
                    role__in=[User.ROLE_ADMIN, User.ROLE_SUPERADMIN],
                    is_active=True,
                )
                for admin_user in admin_users:
                    Notification.notify(
                        recipient=admin_user,
                        notification_type=Notification.TYPE_CLOSURE,
                        title='Ticket Pending Closure',
                        message=f'Ticket {instance.stf_no} is pending closure review.',
                        ticket=instance,
                    )

            # If closed, notify the assigned employee
            if instance.status == 'closed' and instance.assigned_to_id:
                Notification.notify(
                    recipient=instance.assigned_to,
                    notification_type=Notification.TYPE_CLOSURE,
                    title='Ticket Closed',
                    message=f'Ticket {instance.stf_no} has been closed.',
                    ticket=instance,
                )
    except Exception:
        pass


@receiver(post_save, sender='tickets.EscalationLog')
def notify_escalation_log(sender, instance, created, **kwargs):
    """Notify when an escalation log is created."""
    if not created:
        return
    try:
        from .models import Notification
        # Notify the target user (for internal escalations)
        if instance.to_user:
            Notification.notify(
                recipient=instance.to_user,
                notification_type=Notification.TYPE_ESCALATION,
                title='Ticket Escalated to You',
                message=f'Ticket {instance.ticket.stf_no} has been escalated to you. Notes: {instance.notes[:100]}',
                ticket=instance.ticket,
            )
    except Exception:
        pass
