"""Custom JWT authentication middleware for Django Channels WebSocket."""
from urllib.parse import parse_qs
from http.cookies import SimpleCookie
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from django.conf import settings
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_str):
    try:
        token = AccessToken(token_str)
        return User.objects.get(id=token['user_id'])
    except (InvalidToken, TokenError, User.DoesNotExist):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """Extract JWT token from cookie first, then query string ?token=... ."""

    @staticmethod
    def _get_token_from_cookie(scope):
        headers = dict(scope.get('headers', []))
        cookie_header = headers.get(b'cookie')
        if not cookie_header:
            return None
        try:
            cookie = SimpleCookie()
            cookie.load(cookie_header.decode())
            access_cookie = getattr(settings, 'JWT_ACCESS_COOKIE_NAME', 'maptech_access')
            morsel = cookie.get(access_cookie)
            return morsel.value if morsel else None
        except (KeyError, ValueError):
            return None

    async def __call__(self, scope, receive, send):
        token = self._get_token_from_cookie(scope)
        query_string = scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        token = token or params.get('token', [None])[0]
        if token:
            scope['user'] = await get_user_from_token(token)
        else:
            scope['user'] = AnonymousUser()
        return await super().__call__(scope, receive, send)
