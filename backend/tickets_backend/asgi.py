import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import OriginValidator
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tickets_backend.settings')

django_asgi_app = get_asgi_application()

from tickets.middleware import JWTAuthMiddleware
from tickets.routing import websocket_urlpatterns

websocket_app = JWTAuthMiddleware(URLRouter(websocket_urlpatterns))
if not getattr(settings, 'WEBSOCKET_ALLOW_ALL_ORIGINS', False):
    websocket_app = OriginValidator(
        websocket_app,
        getattr(settings, 'WEBSOCKET_ALLOWED_ORIGINS', []),
    )

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': websocket_app,
})
