from rest_framework import routers
from django.urls import path, include
from .views import TicketViewSet, TemplateViewSet, TypeOfServiceViewSet
from users.views import RegisterViewSet, CustomTokenObtainPairView, UserViewSet, google_auth_view, microsoft_auth_view

router = routers.DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='ticket')
router.register(r'templates', TemplateViewSet, basename='template')
router.register(r'auth', RegisterViewSet, basename='auth')
router.register(r'users', UserViewSet, basename='user')
router.register(r'type-of-service', TypeOfServiceViewSet, basename='typeofservice')
router.register(r'csat', CSATSurveyViewSet, basename='csat')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/google/', google_auth_view, name='google_auth'),
    path('auth/microsoft/', microsoft_auth_view, name='microsoft_auth'),
]
