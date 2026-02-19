from rest_framework import viewsets, status
from django.db import IntegrityError
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.conf import settings as django_settings
from django.utils import timezone
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from .models import Ticket, TicketTask, Template
from .serializers import TicketSerializer, RegisterSerializer, UserSerializer, TemplateSerializer


User = get_user_model()


class RegisterViewSet(viewsets.GenericViewSet):
    serializer_class = RegisterSerializer

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
        )
    except ValueError:
        return Response({'detail': 'Invalid Google token.'}, status=status.HTTP_400_BAD_REQUEST)

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


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all().order_by('-created_at')
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.ROLE_ADMIN:
            return Ticket.objects.all().order_by('-created_at')
        if user.role == User.ROLE_EMPLOYEE:
            return Ticket.objects.filter(assigned_to=user).order_by('-created_at')
        # client
        return Ticket.objects.filter(created_by=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def assign(self, request, pk=None):
        # admin only
        if request.user.role != User.ROLE_ADMIN:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        ticket = self.get_object()
        employee_id = request.data.get('employee_id')
        template_id = request.data.get('template_id')
        if not employee_id:
            return Response({'detail': 'employee_id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            emp = User.objects.get(id=employee_id, role=User.ROLE_EMPLOYEE)
        except User.DoesNotExist:
            return Response({'detail': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        ticket.assigned_to = emp
        ticket.status = Ticket.STATUS_OPEN
        ticket.save()
        # create tasks from template if provided
        if template_id:
            try:
                tpl = Template.objects.get(id=template_id)
                steps = [s.strip() for s in tpl.steps.splitlines() if s.strip()]
                for step in steps:
                    TicketTask.objects.create(ticket=ticket, description=step, assigned_to=emp)
            except Template.DoesNotExist:
                pass
        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def escalate(self, request, pk=None):
        ticket = self.get_object()
        user = request.user
        if user.role != User.ROLE_EMPLOYEE or ticket.assigned_to != user:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        ticket.status = Ticket.STATUS_ESCALATED
        ticket.assigned_to = None
        ticket.save()
        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def pass_ticket(self, request, pk=None):
        # employee can pass to another employee
        ticket = self.get_object()
        user = request.user
        if user.role != User.ROLE_EMPLOYEE or ticket.assigned_to != user:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        to_emp_id = request.data.get('employee_id')
        if not to_emp_id:
            return Response({'detail': 'employee_id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            to_emp = User.objects.get(id=to_emp_id, role=User.ROLE_EMPLOYEE)
        except User.DoesNotExist:
            return Response({'detail': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        ticket.assigned_to = to_emp
        ticket.save()
        return Response(self.get_serializer(ticket).data)


class UserViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.all().order_by('-date_joined')

    @action(detail=False, methods=['get'])
    def list_users(self, request):
        if request.user.role != User.ROLE_ADMIN:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        users = self.get_queryset()
        return Response(UserSerializer(users, many=True).data)

    @action(detail=False, methods=['post'])
    def create_user(self, request):
        if request.user.role != User.ROLE_ADMIN:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        from .serializers import AdminUserCreateSerializer
        serializer = AdminUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class TemplateViewSet(viewsets.ModelViewSet):
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # only admins manage templates
        if self.request.user.role == User.ROLE_ADMIN:
            return Template.objects.all()
        return Template.objects.none()

