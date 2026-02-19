from rest_framework import routers
from django.urls import path, include
from .views import TicketViewSet, RegisterViewSet, CustomTokenObtainPairView, TemplateViewSet, UserViewSet

router = routers.DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='ticket')
router.register(r'templates', TemplateViewSet, basename='template')
router.register(r'auth', RegisterViewSet, basename='auth')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
]
