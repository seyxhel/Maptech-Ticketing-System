from rest_framework import viewsets
from django.db.models import Count, Q
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone

from ..models import AuditLog
from ..serializers import AuditLogSerializer
from ..permissions import IsAdminLevel
from django.contrib.auth import get_user_model

User = get_user_model()


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only viewset for audit logs.
    - Superadmin sees audit logs of both admin and employee actors.
    - Admin sees audit logs of employee actors only.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminLevel]
    swagger_tags = ['Audit Logs']

    def _role_filtered_qs(self):
        """Return base queryset filtered by the requesting user's role."""
        qs = AuditLog.objects.all().order_by('-timestamp')
        user = self.request.user
        if user.role == User.ROLE_SUPERADMIN:
            qs = qs.filter(
                Q(actor__role__in=[User.ROLE_ADMIN, User.ROLE_EMPLOYEE]) |
                Q(actor__isnull=True)
            )
        elif user.role == User.ROLE_ADMIN:
            qs = qs.filter(actor__role=User.ROLE_EMPLOYEE)
        else:
            qs = qs.none()
        return qs

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return AuditLog.objects.none()
        qs = self._role_filtered_qs()

        entity = self.request.query_params.get('entity')
        if entity:
            qs = qs.filter(entity=entity)

        action_filter = self.request.query_params.get('action')
        if action_filter:
            qs = qs.filter(action=action_filter)

        actor_email = self.request.query_params.get('actor_email')
        if actor_email:
            qs = qs.filter(actor_email__icontains=actor_email)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(activity__icontains=search) |
                Q(actor_email__icontains=search) |
                Q(entity__icontains=search)
            )

        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(timestamp__date__gte=date_from)
        if date_to:
            qs = qs.filter(timestamp__date__lte=date_to)

        return qs

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Return audit log summary stats for dashboard cards."""
        qs = self._role_filtered_qs()
        total = qs.count()
        by_entity = dict(qs.values_list('entity').annotate(c=Count('id')).values_list('entity', 'c'))
        by_action = dict(qs.values_list('action').annotate(c=Count('id')).values_list('action', 'c'))
        last_24h = qs.filter(timestamp__gte=timezone.now() - timezone.timedelta(hours=24)).count()

        return Response({
            'total': total,
            'last_24h': last_24h,
            'by_entity': by_entity,
            'by_action': by_action,
        })

    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export audit logs as CSV."""
        import csv, json
        from django.http import HttpResponse as DjangoHttpResponse

        qs = self.get_queryset().select_related('actor')
        response = DjangoHttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="audit_logs_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'

        writer = csv.writer(response)
        writer.writerow(['Timestamp', 'Entity', 'Entity ID', 'Activity', 'Action', 'Actor Name', 'Actor Email', 'IP Address', 'Changes'])
        for log in qs[:5000]:
            actor_name = ''
            if log.actor:
                full = log.actor.get_full_name()
                actor_name = full if full.strip() else log.actor.username
            else:
                actor_name = log.actor_email or 'System'

            writer.writerow([
                log.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                log.entity,
                log.entity_id or '',
                log.activity,
                log.action,
                actor_name,
                log.actor_email,
                log.ip_address or '',
                json.dumps(log.changes) if log.changes else '',
            ])

        return response
