from rest_framework import routers
from django.urls import path, include
from drf_yasg.utils import swagger_auto_schema
from .views import (
    TicketViewSet, TypeOfServiceViewSet, EscalationLogViewSet,
    AuditLogViewSet, KnowledgeHubViewSet, PublishedArticleViewSet,
    list_employees,
    ProductViewSet, ClientViewSet, CallLogViewSet, CSATFeedbackViewSet,
    NotificationViewSet,
)
from users.views import AuthViewSet, CustomTokenObtainPairView, UserViewSet
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer

# Tag the JWT views under "Auth"
decorated_login_view = swagger_auto_schema(
    method='post', tags=['Auth'], request_body=TokenObtainPairSerializer
)(CustomTokenObtainPairView.as_view())

decorated_refresh_view = swagger_auto_schema(
    method='post', tags=['Auth'], request_body=TokenRefreshSerializer
)(TokenRefreshView.as_view())

router = routers.DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='ticket')
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'users', UserViewSet, basename='user')
router.register(r'type-of-service', TypeOfServiceViewSet, basename='typeofservice')
router.register(r'escalation-logs', EscalationLogViewSet, basename='escalationlog')
router.register(r'audit-logs', AuditLogViewSet, basename='auditlog')
router.register(r'knowledge-hub', KnowledgeHubViewSet, basename='knowledgehub')
router.register(r'published-articles', PublishedArticleViewSet, basename='publishedarticle')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'call-logs', CallLogViewSet, basename='calllog')
router.register(r'csat-feedback', CSATFeedbackViewSet, basename='csatfeedback')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', decorated_login_view, name='token_obtain_pair'),
    path('auth/token/refresh/', decorated_refresh_view, name='token_refresh'),
    path('employees/', list_employees, name='list_employees'),
]
