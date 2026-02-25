from rest_framework import viewsets, status
from django.db import IntegrityError
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings as django_settings
from django.utils import timezone
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
import jwt
import requests as http_requests
from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()


class RegisterViewSet(viewsets.GenericViewSet):
    serializer_class = RegisterSerializer

    @action(detail=False, methods=['post'], permission_classes=[], url_path='check_unique')
    def check_unique(self, request):
        field = request.data.get('field')
        value = request.data.get('value', '').strip()
        if not field or not value:
            return Response({'detail': 'field and value required.'}, status=status.HTTP_400_BAD_REQUEST)
        if field == 'email':
            exists = User.objects.filter(email__iexact=value).exists()
        elif field == 'username':
            exists = User.objects.filter(username__iexact=value).exists()
        elif field == 'phone':
            import re as _re
            digits = _re.sub(r'\D', '', value)
            if _re.match(r'^0\d{10}$', digits):
                formatted = '+63' + digits[1:]
            elif _re.match(r'^9\d{9}$', digits):
                formatted = '+63' + digits
            elif _re.match(r'^63\d{10}$', digits):
                formatted = '+' + digits
            else:
                formatted = digits
            exists = User.objects.filter(phone=formatted).exists()
        else:
            return Response({'detail': 'Invalid field.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'exists': exists})

    @action(detail=False, methods=['post'], permission_classes=[])
    def register(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = serializer.save()
        except IntegrityError as e:
            return Response({'detail': 'Unable to create account: {}'.format(str(e))}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'detail': 'Unable to create account: {}'.format(str(e))}, status=status.HTTP_400_BAD_REQUEST)
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        return Response(UserSerializer(request.user).data)

    @action(detail=False, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_profile(self, request):
        """Let any authenticated user update their own profile fields."""
        user = request.user
        allowed = ['first_name', 'middle_name', 'last_name', 'suffix', 'phone', 'username']
        for field in allowed:
            if field in request.data:
                setattr(user, field, request.data[field])
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
        return Response(UserSerializer(user).data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def accept_privacy(self, request):
        """Mark the current user as having accepted the privacy policy (one-time)."""
        user = request.user
        user.is_agreed_privacy_policy = True
        user.save(update_fields=['is_agreed_privacy_policy'])
        return Response(UserSerializer(user).data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Let any authenticated user change their password."""
        user = request.user
        current = request.data.get('current_password', '')
        new_pw = request.data.get('new_password', '')

        # Users with unusable password (Google OAuth) can set one without providing current
        if user.has_usable_password():
            if not current:
                return Response({'detail': 'Current password is required.'}, status=status.HTTP_400_BAD_REQUEST)
            if not user.check_password(current):
                return Response({'detail': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        if not new_pw or len(new_pw) < 8:
            return Response({'detail': 'New password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_pw)
        user.save()
        # Return new tokens since password change invalidates old ones
        refresh = RefreshToken.for_user(user)
        return Response({
            'detail': 'Password changed successfully.',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })

    # ── Password reset (public) ──────────────────────────────────────────
    @action(detail=False, methods=['post'], permission_classes=[], url_path='password-reset')
    def password_reset(self, request):
        """Generate a password-reset token for the given email address."""
        email = (request.data.get('email') or '').strip().lower()
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
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password has been reset successfully.'})


@api_view(['POST'])
@permission_classes([])
def google_auth_view(request):
    """Verify Google ID token. If user exists, log them in. If new, auto-create and log in."""
    token = request.data.get('token')
    if not token:
        return Response({'detail': 'Google token is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        idinfo = google_id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            django_settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=60,
        )
    except ValueError as e:
        import logging
        logging.getLogger(__name__).error("Google token verification failed: %s | CLIENT_ID used: %s", e, django_settings.GOOGLE_CLIENT_ID)
        return Response({'detail': f'Invalid Google token: {e}'}, status=status.HTTP_400_BAD_REQUEST)

    email = idinfo.get('email', '')
    first_name = idinfo.get('given_name', '')
    last_name = idinfo.get('family_name', '')

    # If a user with this email already exists, log them in
    try:
        user = User.objects.get(email=email)
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        refresh = RefreshToken.for_user(user)
        return Response({
            'exists': True,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })
    except User.DoesNotExist:
        pass

    # Auto-generate username from first + last name
    import re
    sanitize = lambda s: re.sub(r'[^a-z0-9]', '', (s or '').lower())
    f = sanitize(first_name)
    l = sanitize(last_name)
    base = f"{f}{l}" if f and l else f or l or 'user'
    username = base
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f"{base}{counter}"
        counter += 1

    # Create user with unusable password (they authenticate via Google)
    user = User.objects.create_user(
        username=username,
        email=email,
        first_name=first_name,
        last_name=last_name,
        role=User.ROLE_CLIENT,
    )
    user.set_unusable_password()
    user.last_login = timezone.now()
    user.save()

    refresh = RefreshToken.for_user(user)
    return Response({
        'exists': False,
        'created': True,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data,
    }, status=status.HTTP_201_CREATED)


# ---------- Microsoft / Outlook OAuth2 ----------

# Cache the Microsoft JWKS so we don't fetch on every request
_ms_jwks_client = None


def _get_ms_jwks_client():
    global _ms_jwks_client
    if _ms_jwks_client is None:
        tenant = django_settings.MICROSOFT_TENANT_ID or 'common'
        jwks_url = f'https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys'
        _ms_jwks_client = jwt.PyJWKClient(jwks_url)
    return _ms_jwks_client


@api_view(['POST'])
@permission_classes([])
def microsoft_auth_view(request):
    """Verify Microsoft ID token. If user exists, log them in. If new, auto-create and log in."""
    token = request.data.get('token')
    if not token:
        return Response({'detail': 'Microsoft token is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        tenant = django_settings.MICROSOFT_TENANT_ID or 'common'
        client_id = django_settings.MICROSOFT_CLIENT_ID

        signing_key = _get_ms_jwks_client().get_signing_key_from_jwt(token)

        # Microsoft tokens use 'aud' for the app client-id
        # issuer varies by tenant; with 'common' we skip issuer validation
        decode_options = {
            'verify_aud': True,
            'verify_iss': tenant != 'common',
        }
        issuer = f'https://login.microsoftonline.com/{tenant}/v2.0' if tenant != 'common' else None

        kwargs = {
            'jwt': token,
            'key': signing_key.key,
            'algorithms': ['RS256'],
            'audience': client_id,
            'options': decode_options,
        }
        if issuer:
            kwargs['issuer'] = issuer

        idinfo = jwt.decode(**kwargs)
    except jwt.ExpiredSignatureError:
        return Response({'detail': 'Microsoft token has expired.'}, status=status.HTTP_400_BAD_REQUEST)
    except jwt.InvalidTokenError as e:
        return Response({'detail': f'Invalid Microsoft token: {e}'}, status=status.HTTP_400_BAD_REQUEST)

    email = idinfo.get('preferred_username') or idinfo.get('email', '')
    first_name = idinfo.get('given_name', '') or idinfo.get('name', '').split(' ')[0] if idinfo.get('name') else ''
    last_name = idinfo.get('family_name', '')

    if not email:
        return Response({'detail': 'No email found in Microsoft token.'}, status=status.HTTP_400_BAD_REQUEST)

    # If a user with this email already exists, log them in
    try:
        user = User.objects.get(email=email)
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        refresh = RefreshToken.for_user(user)
        return Response({
            'exists': True,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })
    except User.DoesNotExist:
        pass

    # Auto-generate username from first + last name
    import re
    sanitize = lambda s: re.sub(r'[^a-z0-9]', '', (s or '').lower())
    f = sanitize(first_name)
    l = sanitize(last_name)
    base = f"{f}{l}" if f and l else f or l or 'user'
    username = base
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f"{base}{counter}"
        counter += 1

    # Create user with unusable password (they authenticate via Microsoft)
    user = User.objects.create_user(
        username=username,
        email=email,
        first_name=first_name,
        last_name=last_name,
        role=User.ROLE_CLIENT,
    )
    user.set_unusable_password()
    user.last_login = timezone.now()
    user.save()

    refresh = RefreshToken.for_user(user)
    return Response({
        'exists': False,
        'created': True,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data,
    }, status=status.HTTP_201_CREATED)


class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        # First, try the normal username-based token obtain
        try:
            resp = super().post(request, *args, **kwargs)
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
            data = {**resp.data}
            if user:
                data['user'] = UserSerializer(user).data
            return Response(data)

        # If auth failed, allow login by email: check whether the provided "username" looks like an email
        provided = request.data.get('username') or request.data.get('email')
        password = request.data.get('password')
        if provided and '@' in str(provided) and password:
            try:
                user = User.objects.get(email=provided)
                if user.check_password(password):
                    user.last_login = timezone.now()
                    user.save(update_fields=['last_login'])
                    refresh = RefreshToken.for_user(user)
                    data = {
                        'access': str(refresh.access_token),
                        'refresh': str(refresh),
                        'user': UserSerializer(user).data,
                    }
                    return Response(data)
            except User.DoesNotExist:
                pass

        # otherwise return 401
        return Response({'detail': 'No active account found with the given credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

class UserViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.all().order_by('-date_joined')

    @action(detail=False, methods=['get'])
    def list_users(self, request):
        if not request.user.is_admin_level:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        users = self.get_queryset()
        return Response(UserSerializer(users, many=True).data)

    @action(detail=False, methods=['post'])
    def create_user(self, request):
        if not request.user.is_admin_level:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        from .serializers import AdminUserCreateSerializer
        serializer = AdminUserCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='update_user')
    def update_user(self, request, pk=None):
        """Admin updates user profile fields."""
        if not request.user.is_admin_level:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
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
                setattr(target, field, request.data[field])
        # Keep is_staff in sync with role
        if 'role' in request.data:
            target.is_staff = target.role in (User.ROLE_ADMIN, User.ROLE_SUPERADMIN)
            target.is_superuser = target.role == User.ROLE_SUPERADMIN
        target.save()
        return Response(UserSerializer(target).data)

    @action(detail=True, methods=['post'], url_path='toggle_active')
    def toggle_active(self, request, pk=None):
        """Admin activates or deactivates a user account."""
        if not request.user.is_admin_level:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
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
        return Response(UserSerializer(target).data)

    @action(detail=True, methods=['post'], url_path='reset_password')
    def admin_reset_password(self, request, pk=None):
        """Admin forcefully resets a user's password to a generated default."""
        if not request.user.is_admin_level:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        try:
            target = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        temp_password = 'password123'
        target.set_password(temp_password)
        target.save()
        return Response({'detail': f'Password reset to default for {target.username}.', 'temp_password': temp_password})
