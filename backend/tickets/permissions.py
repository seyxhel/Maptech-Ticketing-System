"""
Role-based DRF permission classes for the ticketing system.

Roles: client, employee, admin, superadmin
"""
from rest_framework.permissions import BasePermission
from django.contrib.auth import get_user_model

User = get_user_model()


class IsClient(BasePermission):
    """Allow only users with `client` role."""
    message = 'Only clients can perform this action.'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == User.ROLE_CLIENT
        )


class IsClientOrAdmin(BasePermission):
    """Allow clients and admin-level users."""
    message = 'Only clients or admins can perform this action.'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and (request.user.role == User.ROLE_CLIENT or request.user.is_admin_level)
        )


class IsEmployee(BasePermission):
    """Allow only users with `employee` role."""
    message = 'Only employees can perform this action.'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == User.ROLE_EMPLOYEE
        )


class IsAdminLevel(BasePermission):
    """Allow admin and superadmin roles."""
    message = 'Only admins can perform this action.'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.is_admin_level
        )


class IsAssignedEmployee(BasePermission):
    """Allow only the employee currently assigned to the ticket (object-level)."""
    message = 'Only the assigned employee can perform this action.'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == User.ROLE_EMPLOYEE
        )

    def has_object_permission(self, request, view, obj):
        return obj.assigned_to == request.user


class IsAdminOrAssignedEmployee(BasePermission):
    """Allow any admin *or* the employee assigned to the ticket."""
    message = 'Only an admin or the assigned employee can perform this action.'

    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_admin_level
            or request.user.role == User.ROLE_EMPLOYEE
        )

    def has_object_permission(self, request, view, obj):
        if request.user.is_admin_level:
            return True
        return (
            request.user.role == User.ROLE_EMPLOYEE
            and obj.assigned_to == request.user
        )


class IsTicketParticipant(BasePermission):
    """Allow the client who created the ticket, the assigned employee, or any admin."""
    message = 'You are not a participant of this ticket.'

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_admin_level:
            return True
        if user.role == User.ROLE_EMPLOYEE and obj.assigned_to == user:
            return True
        if user.role == User.ROLE_CLIENT and obj.created_by == user:
            return True
        return False
