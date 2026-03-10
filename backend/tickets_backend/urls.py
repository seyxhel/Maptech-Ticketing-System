from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve as static_serve
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

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/', include('tickets.urls')),
    path('api-auth/', include('rest_framework.urls')),  # DRF browsable API login

    # Swagger / OpenAPI docs
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Serve media files in production (Daphne has no separate file server)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', static_serve, {'document_root': settings.MEDIA_ROOT}),
    ]
