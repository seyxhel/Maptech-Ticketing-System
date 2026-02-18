from rest_framework import routers
from django.urls import path, include
from .views import TicketViewSet, RegisterViewSet, CustomObtainAuthToken, TemplateViewSet

router = routers.DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='ticket')
router.register(r'templates', TemplateViewSet, basename='template')
router.register(r'auth', RegisterViewSet, basename='auth')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', CustomObtainAuthToken.as_view(), name='api_token_auth'),
]
