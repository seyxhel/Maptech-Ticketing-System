from rest_framework import routers
from django.urls import path, include
from .views import TicketViewSet, RegisterViewSet, CustomTokenObtainPairView, TemplateViewSet, UserViewSet, google_auth_view, google_register_view

router = routers.DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='ticket')
router.register(r'templates', TemplateViewSet, basename='template')
router.register(r'auth', RegisterViewSet, basename='auth')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/google/', google_auth_view, name='google_auth'),
    path('auth/google/register/', google_register_view, name='google_register'),
]
