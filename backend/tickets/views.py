from rest_framework import viewsets, status
from django.db import IntegrityError
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
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


class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        # First, try the normal username-based token obtain
        resp = super().post(request, *args, **kwargs)
        # If auth succeeded, attach the user data as before
        if getattr(resp, 'status_code', None) == 200 and isinstance(resp.data, dict):
            username = request.data.get('username') or request.data.get('email')
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                user = None
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
                    refresh = RefreshToken.for_user(user)
                    data = {
                        'access': str(refresh.access_token),
                        'refresh': str(refresh),
                        'user': UserSerializer(user).data,
                    }
                    return Response(data)
            except User.DoesNotExist:
                pass

        # otherwise return the original response (likely 401)
        return resp


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

