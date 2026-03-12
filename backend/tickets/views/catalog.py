from rest_framework import viewsets
from django.db.models import Q
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Category, Product, Client, Ticket
from ..serializers import CategorySerializer, ProductSerializer, ClientSerializer, TicketSerializer
from ..permissions import IsAdminLevel


class CategoryViewSet(viewsets.ModelViewSet):
    """CRUD for product categories. Admin manages, all authenticated can list."""
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    swagger_tags = ['Categories']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminLevel()]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Category.objects.none()
        qs = Category.objects.all().order_by('name')
        if not self.request.user.is_admin_level:
            qs = qs.filter(is_active=True)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        return qs


class ProductViewSet(viewsets.ModelViewSet):
    """CRUD for global Product catalog. Admin manages, all authenticated can list."""
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    swagger_tags = ['Products']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminLevel()]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Product.objects.none()
        qs = Product.objects.all().order_by('-created_at')
        if not self.request.user.is_admin_level:
            qs = qs.filter(is_active=True)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(product_name__icontains=search) |
                Q(brand__icontains=search) |
                Q(model_name__icontains=search) |
                Q(serial_no__icontains=search) |
                Q(device_equipment__icontains=search) |
                Q(sales_no__icontains=search) |
                Q(others__icontains=search)
            )
        return qs


class ClientViewSet(viewsets.ModelViewSet):
    """CRUD for Client master data. Admin manages, all authenticated can list."""
    queryset = Client.objects.all().order_by('client_name')
    serializer_class = ClientSerializer
    swagger_tags = ['Clients']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminLevel()]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Client.objects.none()
        qs = Client.objects.all().order_by('client_name')
        if not self.request.user.is_admin_level:
            qs = qs.filter(is_active=True)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(client_name__icontains=search) |
                Q(contact_person__icontains=search) |
                Q(email_address__icontains=search) |
                Q(department_organization__icontains=search)
            )
        return qs

    @action(detail=True, methods=['get'])
    def tickets(self, request, pk=None):
        """Return all tickets linked to this client."""
        client = self.get_object()
        tickets = Ticket.objects.filter(
            Q(client_record=client) | Q(client__iexact=client.client_name)
        ).order_by('-created_at')
        return Response(TicketSerializer(tickets, many=True, context={'request': request}).data)
