from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
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
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data}, status=status.HTTP_201_CREATED)


class CustomObtainAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        resp = super().post(request, *args, **kwargs)
        token_key = resp.data.get('token')
        token = Token.objects.get(key=token_key)
        user = token.user
        return Response({'token': token.key, 'user': UserSerializer(user).data})


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


class TemplateViewSet(viewsets.ModelViewSet):
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # only admins manage templates
        if self.request.user.role == User.ROLE_ADMIN:
            return Template.objects.all()
        return Template.objects.none()

