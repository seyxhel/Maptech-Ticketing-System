from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.utils import timezone
from .serializers import UserSerializer

User = get_user_model()


class AuthViewSet(viewsets.GenericViewSet):
    """Auth-related actions (me, update_profile, change_password, password reset)."""
    serializer_class = UserSerializer
    swagger_tags = ['Auth']

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
                        'user': UserSerializer(user).data,
                    }
                    return Response(data)
            except User.DoesNotExist:
                pass

        # otherwise return 401
        return Response({'detail': 'No active account found with the given credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

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

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

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
                setattr(target, field, request.data[field])
        # Keep is_staff in sync with role
        if 'role' in request.data:
            target.is_staff = target.role in (User.ROLE_ADMIN, User.ROLE_SUPERADMIN)
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
        """Superadmin forcefully resets a user's password to a generated default."""
        if request.user.role != 'superadmin':
            return Response({'detail': 'Only superadmins can manage users.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            target = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        temp_password = 'password123'
        target.set_password(temp_password)
        target.save()

        # Audit log
        try:
            from tickets.models import AuditLog
            x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
            ip = x_forwarded.split(',')[0].strip() if x_forwarded else request.META.get('REMOTE_ADDR')
            AuditLog.log(
                entity=AuditLog.ENTITY_USER,
                entity_id=target.id,
                action=AuditLog.ACTION_PASSWORD_RESET,
                activity=f"{request.user.email} reset password for {target.email}",
                actor=request.user,
                ip_address=ip,
            )
        except Exception:
            pass

        return Response({'detail': f'Password reset to default for {target.username}.', 'temp_password': temp_password})
