from django.urls import include, path

from drf_yasg.utils import swagger_auto_schema
from rest_framework import routers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer

from .views import (
    AnnouncementViewSet,
    AuditLogViewSet,
    CategoryViewSet,
    CallLogViewSet,
    ClientViewSet,
    EscalationLogViewSet,
    FeedbackRatingViewSet,
    KnowledgeHubViewSet,
    NotificationViewSet,
    ProductViewSet,
    PublishedArticleViewSet,
    RetentionPolicyViewSet,
    TicketViewSet,
    TypeOfServiceViewSet,
    list_employees,
    list_sales_users,
    list_supervisors,
)
from users.views import AuthViewSet, CustomTokenObtainPairView, CustomTokenRefreshView, UserViewSet

# Tag the JWT views under "Auth"
decorated_login_view = swagger_auto_schema(
    method='post', tags=['Auth'], request_body=TokenObtainPairSerializer
)(CustomTokenObtainPairView.as_view())

decorated_refresh_view = swagger_auto_schema(
    method='post', tags=['Auth'], request_body=TokenRefreshSerializer
)(CustomTokenRefreshView.as_view())

router = routers.DefaultRouter()

for prefix, viewset, basename in [
    (r'tickets', TicketViewSet, 'ticket'),
    (r'auth', AuthViewSet, 'auth'),
    (r'users', UserViewSet, 'user'),
    (r'type-of-service', TypeOfServiceViewSet, 'typeofservice'),
    (r'escalation-logs', EscalationLogViewSet, 'escalationlog'),
    (r'audit-logs', AuditLogViewSet, 'auditlog'),
    (r'knowledge-hub', KnowledgeHubViewSet, 'knowledgehub'),
    (r'published-articles', PublishedArticleViewSet, 'publishedarticle'),
    (r'device-equipment', CategoryViewSet, 'deviceequipment'),
    (r'categories', CategoryViewSet, 'category'),
    (r'products', ProductViewSet, 'product'),
    (r'clients', ClientViewSet, 'client'),
    (r'call-logs', CallLogViewSet, 'calllog'),
    (r'feedback-ratings', FeedbackRatingViewSet, 'feedbackrating'),
    (r'notifications', NotificationViewSet, 'notification'),
    (r'retention-policy', RetentionPolicyViewSet, 'retentionpolicy'),
    (r'announcements', AnnouncementViewSet, 'announcement'),
]:
    router.register(prefix, viewset, basename=basename)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', decorated_login_view, name='token_obtain_pair'),
    path('auth/token/refresh/', decorated_refresh_view, name='token_refresh'),
    path('employees/', list_employees, name='list_employees'),
    path('sales-users/', list_sales_users, name='list_sales_users'),
    path('supervisors/', list_supervisors, name='list_supervisors'),
]
