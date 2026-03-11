from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="Maptech Ticketing System API",
        default_version='v1',
        description="API documentation for the Maptech Ticketing System",
        contact=openapi.Contact(email="support@maptech.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
    authentication_classes=[],
)

@api_view(['GET'])
def api_root(request):
    return Response({
        'admin': request.build_absolute_uri('/admin/'),
        'api (tickets, auth, users, etc.)': request.build_absolute_uri('/api/'),
        'api-auth (DRF browsable login)': request.build_absolute_uri('/api/auth/login/'),
        'swagger': request.build_absolute_uri('/swagger/'),
        'redoc': request.build_absolute_uri('/redoc/'),
    })


@api_view(['GET'])
def healthz(request):
    # Lightweight readiness probe used by platform health checks.
    return Response({'status': 'ok'})

urlpatterns = [
    path('', api_root, name='api-root'),
    path('healthz', healthz, name='healthz'),
    path('admin/', admin.site.urls),
    path('api/', include('tickets.urls')),
    path('api-auth/', include('rest_framework.urls')),  # DRF browsable API login

    # Swagger / OpenAPI docs
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Always serve media files (profile pictures, ticket attachments, etc.)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
