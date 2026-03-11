from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone

from ..models import RetentionPolicy, Announcement
from ..serializers import RetentionPolicySerializer, AnnouncementSerializer
from ..permissions import IsSuperAdmin


class RetentionPolicyViewSet(viewsets.ViewSet):
    """Singleton retention policy — superadmin can view and update."""
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    swagger_tags = ['Retention Policy']

    def list(self, request):
        """Return the current retention policy."""
        policy = RetentionPolicy.get_policy()
        return Response(RetentionPolicySerializer(policy).data)

    def create(self, request):
        """Update the singleton retention policy (uses POST for simplicity)."""
        policy = RetentionPolicy.get_policy()
        serializer = RetentionPolicySerializer(policy, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(serializer.data)


class AnnouncementViewSet(viewsets.ModelViewSet):
    """
    Superadmin: full CRUD.
    Admin / Employee: list only (filtered by visibility & active date range).
    """
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]
    swagger_tags = ['Announcements']

    def get_queryset(self):
        user = self.request.user
        qs = Announcement.objects.all()

        if user.role == 'superadmin':
            return qs

        # Non-superadmin users only see active announcements within date range
        now = timezone.now()
        qs = qs.filter(is_active=True, start_date__lte=now).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=now)
        )

        if user.role == 'admin':
            return qs.filter(visibility__in=['all', 'admin'])
        elif user.role == 'employee':
            return qs.filter(visibility__in=['all', 'employee'])

        return qs.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def check_permissions(self, request):
        super().check_permissions(request)
        if self.action not in ('list', 'retrieve') and request.user.role != 'superadmin':
            self.permission_denied(request, message='Only superadmin can manage announcements.')
