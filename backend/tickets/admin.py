from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import Ticket, TicketTask, Template

User = get_user_model()


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'phone', 'role', 'is_staff', 'last_login')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone')


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'created_by', 'assigned_to', 'created_at')
    list_filter = ('status',)


@admin.register(TicketTask)
class TicketTaskAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'description', 'assigned_to', 'status', 'created_at')


@admin.register(Template)
class TemplateAdmin(admin.ModelAdmin):
    list_display = ('name',)
