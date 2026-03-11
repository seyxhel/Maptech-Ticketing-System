from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Notification
from ..serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    """Notifications for the authenticated user.

    GET /notifications/              → list (most recent first)
    GET /notifications/unread_count/ → {"count": N}
    POST /notifications/mark_read/   → {"notification_ids": [1,2,3]}
    POST /notifications/mark_all_read/ → marks everything as read
    DELETE /notifications/<id>/      → delete single notification
    POST /notifications/clear_all/   → delete all notifications for user
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    swagger_tags = ['Notifications']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Notification.objects.none()
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        is_read = request.query_params.get('is_read')
        if is_read is not None:
            qs = qs.filter(is_read=is_read.lower() in ('true', '1', 'yes'))
        serializer = self.get_serializer(qs[:100], many=True)  # Cap at 100
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'count': count})

    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        ids = request.data.get('notification_ids', [])
        if not ids:
            return Response({'detail': 'notification_ids required.'}, status=status.HTTP_400_BAD_REQUEST)
        updated = Notification.objects.filter(recipient=request.user, id__in=ids, is_read=False).update(is_read=True)
        return Response({'updated': updated})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        updated = Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'updated': updated})

    @action(detail=False, methods=['post'])
    def clear_all(self, request):
        deleted, _ = Notification.objects.filter(recipient=request.user).delete()
        return Response({'deleted': deleted})
