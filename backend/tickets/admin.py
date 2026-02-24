from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import Ticket, TicketTask, Template, TypeOfService, TicketAttachment, EscalationLog, CSATSurvey

User = get_user_model()


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'phone', 'role', 'is_staff', 'last_login')
    list_filter = ('role', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone')


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('stf_no', 'status', 'priority', 'created_by', 'assigned_to', 'confirmed_by_admin', 'created_at')
    list_filter = ('status', 'priority', 'job_status', 'confirmed_by_admin')
    search_fields = ('stf_no', 'client', 'contact_person')


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
    list_display = ('ticket', 'file', 'uploaded_by', 'is_resolution_proof', 'uploaded_at')
    list_filter = ('is_resolution_proof',)


@admin.register(EscalationLog)
class EscalationLogAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'escalation_type', 'from_user', 'to_user', 'to_external', 'created_at')
    list_filter = ('escalation_type',)


@admin.register(CSATSurvey)
class CSATSurveyAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'rating', 'has_other_concerns', 'created_at')
