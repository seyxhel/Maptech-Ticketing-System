import hashlib
import logging
import requests as http_requests

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import get_user_model
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.utils import timezone
from tickets.input_security import clean_text
from .serializers import UserSerializer

logger = logging.getLogger(__name__)


def _is_password_pwned(password: str) -> bool:
    """Check the HIBP Passwords API (k-anonymity).  Returns True if breached."""
    sha1 = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
    prefix, suffix = sha1[:5], sha1[5:]
    try:
        resp = http_requests.get(
            f'https://api.pwnedpasswords.com/range/{prefix}',
            timeout=5,
            headers={'Add-Padding': 'true'},
        )
        if resp.status_code == 200:
            for line in resp.text.splitlines():
                hash_suffix, _, _ = line.partition(':')
                if hash_suffix.strip() == suffix:
                    return True
    except Exception as e:
        # Network failure — allow the password rather than blocking the user
        logger.warning(f'HIBP password check failed: {e}')
    return False

User = get_user_model()


def _cookie_names() -> tuple[str, str]:
    return (
        getattr(settings, 'JWT_ACCESS_COOKIE_NAME', 'maptech_access'),
        getattr(settings, 'JWT_REFRESH_COOKIE_NAME', 'maptech_refresh'),
    )


def _cookie_kwargs(max_age: int | None = None) -> dict:
    raw_samesite = str(getattr(settings, 'JWT_COOKIE_SAMESITE', 'Lax') or 'Lax').strip()
    samesite_norm = raw_samesite.lower()
    if samesite_norm == 'none':
        samesite = 'None'
    elif samesite_norm == 'strict':
        samesite = 'Strict'
    else:
        samesite = 'Lax'

    secure = bool(getattr(settings, 'JWT_COOKIE_SECURE', not settings.DEBUG))
    # Browsers require Secure when SameSite=None.
    if samesite == 'None':
        secure = True

    kwargs = {
        'httponly': getattr(settings, 'JWT_COOKIE_HTTPONLY', True),
        'secure': secure,
        'samesite': samesite,
        'path': getattr(settings, 'JWT_COOKIE_PATH', '/'),
    }
    domain = getattr(settings, 'JWT_COOKIE_DOMAIN', None)
    if isinstance(domain, str):
        domain = domain.strip()
        if domain.startswith('http://') or domain.startswith('https://'):
            domain = domain.split('://', 1)[1]
        domain = domain.split('/', 1)[0].strip()
    if domain:
        kwargs['domain'] = domain
    if max_age is not None:
        kwargs['max_age'] = max_age
    return kwargs


def _set_auth_cookies(response: Response, access: str | None = None, refresh: str | None = None, remember: bool = False):
    access_cookie, refresh_cookie = _cookie_names()
    access_lifetime = int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
    refresh_lifetime = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())

    if access:
        response.set_cookie(
            access_cookie,
            access,
            **_cookie_kwargs(max_age=access_lifetime if remember else None),
        )
    if refresh:
        response.set_cookie(
            refresh_cookie,
            refresh,
            **_cookie_kwargs(max_age=refresh_lifetime if remember else None),
        )


def _clear_auth_cookies(response: Response):
    access_cookie, refresh_cookie = _cookie_names()
    cookie_kwargs = _cookie_kwargs()
    path = cookie_kwargs.get('path', '/')
    domain = cookie_kwargs.get('domain')
    response.delete_cookie(access_cookie, path=path, domain=domain)
    response.delete_cookie(refresh_cookie, path=path, domain=domain)


class AuthViewSet(viewsets.GenericViewSet):
    """Auth-related actions (me, update_profile, change_password, password reset)."""
    serializer_class = UserSerializer
    swagger_tags = ['Auth']

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        return Response(UserSerializer(request.user, context={'request': request}).data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated],
            url_path='upload_avatar', parser_classes=[MultiPartParser, FormParser])
    def upload_avatar(self, request):
        """Upload or replace the authenticated user's profile picture."""
        if 'profile_picture' not in request.FILES:
            return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)
        file = request.FILES['profile_picture']
        # Validate content type
        if not file.content_type.startswith('image/'):
            return Response({'detail': 'File must be an image.'}, status=status.HTTP_400_BAD_REQUEST)
        # Limit to 5 MB
        if file.size > 5 * 1024 * 1024:
            return Response({'detail': 'Image must be 5 MB or smaller.'}, status=status.HTTP_400_BAD_REQUEST)
        user = request.user
        # Remove old picture to save storage
        if user.profile_picture:
            try:
                user.profile_picture.delete(save=False)
            except Exception:
                pass
        user.profile_picture = file
        user.save(update_fields=['profile_picture'])
        return Response(UserSerializer(user, context={'request': request}).data)

    @action(detail=False, methods=['delete'], permission_classes=[IsAuthenticated], url_path='remove_avatar')
    def remove_avatar(self, request):
        """Remove the authenticated user's profile picture."""
        user = request.user
        if user.profile_picture:
            try:
                user.profile_picture.delete(save=False)
            except Exception:
                pass
            user.profile_picture = None
            user.save(update_fields=['profile_picture'])
        return Response(UserSerializer(user, context={'request': request}).data)

    @action(detail=False, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_profile(self, request):
        """Let any authenticated user update their own profile fields."""
        user = request.user
        allowed = ['first_name', 'middle_name', 'last_name', 'suffix', 'phone', 'username']
        for field in allowed:
            if field in request.data:
                setattr(user, field, clean_text(request.data[field], max_length=150 if field != 'phone' else 30))
        # Format phone server-side
        import re as _re
        raw_phone = _re.sub(r'\D', '', user.phone or '')
        if _re.match(r'^0\d{10}$', raw_phone):
            user.phone = '+63' + raw_phone[1:]
        elif _re.match(r'^9\d{9}$', raw_phone):
            user.phone = '+63' + raw_phone
        elif _re.match(r'^63\d{10}$', raw_phone):
            user.phone = '+' + raw_phone
        user.save()
        return Response(UserSerializer(user, context={'request': request}).data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Let any authenticated user change their password."""
        user = request.user
        current = request.data.get('current_password', '')
        new_pw = request.data.get('new_password', '')

        # Users with unusable password can set one without providing current
        if user.has_usable_password():
            if not current:
                return Response({'detail': 'Current password is required.'}, status=status.HTTP_400_BAD_REQUEST)
            if not user.check_password(current):
                return Response({'detail': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        if not new_pw or len(new_pw) < 8:
            return Response({'detail': 'New password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        # HIBP breach check — warn but allow
        breach_warning = ''
        if _is_password_pwned(new_pw):
            breach_warning = 'Warning: this password has been found in a data breach. Consider changing it later.'

        user.set_password(new_pw)
        user.save()
        # Return new tokens since password change invalidates old ones
        refresh = RefreshToken.for_user(user)
        response_data = {
            'detail': 'Password changed successfully.',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
        if breach_warning:
            response_data['warning'] = breach_warning
        response = Response(response_data)
        _set_auth_cookies(
            response,
            access=response_data['access'],
            refresh=response_data['refresh'],
            remember=True,
        )
        return response

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated], url_path='logout')
    def logout(self, request):
        response = Response({'detail': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        _clear_auth_cookies(response)
        try:
            from tickets.models import AuditLog
            x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
            ip = x_forwarded.split(',')[0].strip() if x_forwarded else request.META.get('REMOTE_ADDR')
            AuditLog.log(
                entity=AuditLog.ENTITY_USER,
                entity_id=request.user.id,
                action=AuditLog.ACTION_LOGOUT,
                activity=f"{request.user.email} logged out",
                actor=request.user,
                ip_address=ip,
            )
        except Exception:
            pass
        return response

    # ── Password reset (public) ──────────────────────────────────────────
    @action(detail=False, methods=['post'], permission_classes=[], url_path='password-reset')
    def password_reset(self, request):
        """Generate a password-reset token for the given email address."""
        email = clean_text(request.data.get('email'), max_length=254).lower()
        # Always return a generic success to prevent email enumeration
        generic = {'detail': 'If an account with that email exists, a reset link has been sent.'}
        if not email:
            return Response(generic)
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(generic)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        # In production, send an email with the reset link.
        # For development / SPA, return uid+token so the frontend can build a reset URL.
        reset_url = f"/reset-password/{uid}/{token}/"
        # TODO: integrate actual email sending here
        return Response({'detail': generic['detail'], 'reset_url': reset_url, 'uid': uid, 'token': token})

    @action(detail=False, methods=['post'], permission_classes=[], url_path='password-reset-by-key')
    def password_reset_by_key(self, request):
        """Reset password using the user's unique recovery key and email."""
        recovery_key = clean_text(request.data.get('recovery_key'), max_length=255)
        email = clean_text(request.data.get('email'), max_length=254).lower()
        new_password = request.data.get('new_password', '')
        if not recovery_key or not email or not new_password:
            return Response(
                {'detail': 'Email, recovery key, and new password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        _WRONG = 'Invalid Credentials'
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({'detail': _WRONG}, status=status.HTTP_400_BAD_REQUEST)
        if not user.check_recovery_key(recovery_key):
            return Response({'detail': _WRONG}, status=status.HTTP_400_BAD_REQUEST)
        if not user.is_active:
            return Response(
                {'detail': 'This account has been deactivated. Please contact an administrator.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(new_password) < 8:
            return Response(
                {'detail': 'Password must be at least 8 characters.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if _is_password_pwned(new_password):
            return Response(
                {'detail': 'This password has been found in a data breach. Please choose a different password.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password has been reset successfully.'})

    @action(detail=False, methods=['post'], permission_classes=[], url_path='password-reset-confirm')
    def password_reset_confirm(self, request):
        """Confirm password reset with uid, token, and new_password."""
        uid = request.data.get('uid', '')
        token = request.data.get('token', '')
        new_password = request.data.get('new_password', '')
        if not uid or not token or not new_password:
            return Response({'detail': 'uid, token, and new_password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=pk)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'detail': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)
        if not default_token_generator.check_token(user, token):
            return Response({'detail': 'Token is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({'detail': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        if _is_password_pwned(new_password):
            return Response(
                {'detail': 'This password has been found in a data breach. Please choose a different password.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password has been reset successfully.'})


class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        incoming = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        remember = bool(incoming.pop('remember_me', False))
        # First, try the normal username-based token obtain
        try:
            serializer = self.get_serializer(data=incoming)
            serializer.is_valid(raise_exception=True)
            resp = Response(serializer.validated_data, status=status.HTTP_200_OK)
        except Exception:
            resp = None

        # If auth succeeded, attach the user data
        if resp and getattr(resp, 'status_code', None) == 200 and isinstance(resp.data, dict):
            username = request.data.get('username') or request.data.get('email')
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                user = None
            if user:
                user.last_login = timezone.now()
                user.save(update_fields=['last_login'])
                # Audit log for login
                try:
                    from tickets.models import AuditLog
                    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
                    ip = x_forwarded.split(',')[0].strip() if x_forwarded else request.META.get('REMOTE_ADDR')
                    AuditLog.log(
                        entity=AuditLog.ENTITY_USER,
                        entity_id=user.id,
                        action=AuditLog.ACTION_LOGIN,
                        activity=f"{user.email} logged in via username",
                        actor=user,
                        ip_address=ip,
                    )
                except Exception:
                    pass
            data = {**resp.data}
            if user:
                data['user'] = UserSerializer(user, context={'request': request}).data
            response = Response(data)
            _set_auth_cookies(response, access=data.get('access'), refresh=data.get('refresh'), remember=remember)
            return response

        # If auth failed, allow login by email: check whether the provided "username" looks like an email
        provided = request.data.get('username') or request.data.get('email')
        password = request.data.get('password')
        if provided and '@' in str(provided) and password:
            try:
                user = User.objects.get(email=provided)
                if not user.is_active:
                    return Response({'detail': 'Your account has been deactivated. Please contact an administrator.'}, status=status.HTTP_401_UNAUTHORIZED)
                if user.check_password(password):
                    user.last_login = timezone.now()
                    user.save(update_fields=['last_login'])
                    refresh = RefreshToken.for_user(user)
                    # Audit log for email login
                    try:
                        from tickets.models import AuditLog
                        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
                        ip = x_forwarded.split(',')[0].strip() if x_forwarded else request.META.get('REMOTE_ADDR')
                        AuditLog.log(
                            entity=AuditLog.ENTITY_USER,
                            entity_id=user.id,
                            action=AuditLog.ACTION_LOGIN,
                            activity=f"{user.email} logged in via email",
                            actor=user,
                            ip_address=ip,
                        )
                    except Exception:
                        pass
                    data = {
                        'access': str(refresh.access_token),
                        'refresh': str(refresh),
                        'user': UserSerializer(user, context={'request': request}).data,
                    }
                    response = Response(data)
                    _set_auth_cookies(response, access=data.get('access'), refresh=data.get('refresh'), remember=remember)
                    return response
            except User.DoesNotExist:
                pass

        # otherwise return 401
        return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)


class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_cookie_name = getattr(settings, 'JWT_REFRESH_COOKIE_NAME', 'maptech_refresh')
        refresh_from_cookie = request.COOKIES.get(refresh_cookie_name)

        incoming = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if not incoming.get('refresh') and refresh_from_cookie:
            incoming['refresh'] = refresh_from_cookie

        serializer = self.get_serializer(data=incoming)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as exc:
            raise InvalidToken(exc.args[0])

        data = serializer.validated_data
        response = Response(data, status=status.HTTP_200_OK)
        _set_auth_cookies(
            response,
            access=data.get('access'),
            refresh=data.get('refresh'),
            remember=True,
        )
        return response

class UserViewSet(viewsets.GenericViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    swagger_tags = ['Users']

    def get_queryset(self):
        return User.objects.all().order_by('-date_joined')

    @action(detail=False, methods=['get'])
    def list_users(self, request):
        if request.user.role != 'superadmin':
            return Response({'detail': 'Only superadmins can manage users.'}, status=status.HTTP_403_FORBIDDEN)
        users = self.get_queryset()
        return Response(UserSerializer(users, many=True).data)

    @action(detail=False, methods=['post'])
    def create_user(self, request):
        if request.user.role != 'superadmin':
            return Response({'detail': 'Only superadmins can manage users.'}, status=status.HTTP_403_FORBIDDEN)
        from .serializers import AdminUserCreateSerializer
        serializer = AdminUserCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Audit log
        try:
            from tickets.models import AuditLog
            x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
            ip = x_forwarded.split(',')[0].strip() if x_forwarded else request.META.get('REMOTE_ADDR')
            AuditLog.log(
                entity=AuditLog.ENTITY_USER,
                entity_id=user.id,
                action=AuditLog.ACTION_CREATE,
                activity=f"{request.user.email} created user {user.email} with role {user.role}",
                actor=request.user,
                ip_address=ip,
            )
        except Exception:
            pass

        payload = UserSerializer(user, context={'request': request}).data
        payload['recovery_key'] = getattr(user, '_plain_recovery_key', '')
        return Response(payload, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='update_user')
    def update_user(self, request, pk=None):
        """Superadmin updates user profile fields."""
        if request.user.role != 'superadmin':
            return Response({'detail': 'Only superadmins can manage users.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            target = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        # Prevent editing superadmin unless you are superadmin
        if target.role == User.ROLE_SUPERADMIN and request.user.role != User.ROLE_SUPERADMIN:
            return Response({'detail': 'Cannot edit a superadmin account.'}, status=status.HTTP_403_FORBIDDEN)
        allowed = ['first_name', 'middle_name', 'last_name', 'suffix', 'email', 'phone', 'role']
        for field in allowed:
            if field in request.data:
                max_length = 254 if field == 'email' else 30 if field == 'phone' else 150
                value = clean_text(request.data[field], max_length=max_length)
                if field == 'email':
                    value = value.lower()
                setattr(target, field, value)
        # Keep is_staff in sync with role
        if 'role' in request.data:
            target.is_staff = target.role in (User.ROLE_SALES, User.ROLE_ADMIN, User.ROLE_SUPERADMIN)
            target.is_superuser = target.role == User.ROLE_SUPERADMIN
        target.save()
        return Response(UserSerializer(target).data)

    @action(detail=True, methods=['post'], url_path='toggle_active')
    def toggle_active(self, request, pk=None):
        """Superadmin activates or deactivates a user account."""
        if request.user.role != 'superadmin':
            return Response({'detail': 'Only superadmins can manage users.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            target = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        if target.id == request.user.id:
            return Response({'detail': 'Cannot deactivate your own account.'}, status=status.HTTP_400_BAD_REQUEST)
        if target.role == User.ROLE_SUPERADMIN and request.user.role != User.ROLE_SUPERADMIN:
            return Response({'detail': 'Cannot deactivate a superadmin.'}, status=status.HTTP_403_FORBIDDEN)
        target.is_active = not target.is_active
        target.save(update_fields=['is_active'])

        # Audit log
        try:
            from tickets.models import AuditLog
            x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
            ip = x_forwarded.split(',')[0].strip() if x_forwarded else request.META.get('REMOTE_ADDR')
            action_text = 'activated' if target.is_active else 'deactivated'
            AuditLog.log(
                entity=AuditLog.ENTITY_USER,
                entity_id=target.id,
                action=AuditLog.ACTION_UPDATE,
                activity=f"{request.user.email} {action_text} user {target.email}",
                actor=request.user,
                ip_address=ip,
            )
        except Exception:
            pass

        return Response(UserSerializer(target).data)

    @action(detail=True, methods=['post'], url_path='reset_password')
    def admin_reset_password(self, request, pk=None):
        """Superadmin forcefully changes a user's password."""
        if request.user.role != 'superadmin':
            return Response({'detail': 'Only superadmins can manage users.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            target = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_password = request.data.get('new_password', '')
        if not new_password:
            return Response({'detail': 'New password is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({
                'detail': 'Password must be at least 8 characters.',
                'code': 'password_too_short'
            }, status=status.HTTP_400_BAD_REQUEST)
        if _is_password_pwned(new_password):
            return Response(
                {
                    'detail': 'This password has been found in a data breach. Please choose a different password.',
                    'code': 'password_compromised'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        target.set_password(new_password)
        target.save(update_fields=['password'])

        # Audit log
        try:
            from tickets.models import AuditLog
            x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
            ip = x_forwarded.split(',')[0].strip() if x_forwarded else request.META.get('REMOTE_ADDR')
            AuditLog.log(
                entity=AuditLog.ENTITY_USER,
                entity_id=target.id,
                action=AuditLog.ACTION_PASSWORD_RESET,
                activity=f"{request.user.email} changed password for {target.email}",
                actor=request.user,
                ip_address=ip,
            )
        except Exception:
            pass

        return Response({
            'detail': f'Password updated for {target.username}.',
            'success': True
        })
