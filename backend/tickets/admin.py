from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import Ticket, TicketTask, Template, TypeOfService, TicketAttachment

User = get_user_model()


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'phone', 'role', 'is_staff', 'last_login')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone')


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('stf_no', 'title', 'status', 'priority', 'created_by', 'assigned_to', 'created_at')
    list_filter = ('status', 'priority', 'job_status')
    search_fields = ('stf_no', 'title', 'client', 'contact_person')


@admin.register(TicketTask)
class TicketTaskAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'description', 'assigned_to', 'status', 'created_at')


@admin.register(Template)
class TemplateAdmin(admin.ModelAdmin):
    list_display = ('name',)


@admin.register(TypeOfService)
class TypeOfServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'is_active')
    list_filter = ('is_active',)


@admin.register(TicketAttachment)
class TicketAttachmentAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'file', 'uploaded_by', 'uploaded_at')
