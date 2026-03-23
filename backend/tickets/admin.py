from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import Ticket, TicketTask, TypeOfService, TicketAttachment, EscalationLog, AuditLog, Product, Client, CallLog, CSATFeedback, Notification, Category, RetentionPolicy, Announcement

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


@admin.register(TypeOfService)
class TypeOfServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'estimated_resolution_days', 'is_active')
    list_filter = ('is_active',)


@admin.register(TicketAttachment)
class TicketAttachmentAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'file', 'uploaded_by', 'is_resolution_proof', 'uploaded_at')
    list_filter = ('is_resolution_proof',)


@admin.register(EscalationLog)
class EscalationLogAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'escalation_type', 'from_user', 'to_user', 'to_external', 'created_at')
    list_filter = ('escalation_type',)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'entity', 'action', 'activity', 'actor_email', 'ip_address')
    list_filter = ('entity', 'action')
    search_fields = ('activity', 'actor_email', 'ip_address')
    readonly_fields = ('timestamp', 'entity', 'entity_id', 'action', 'activity', 'actor', 'actor_email', 'ip_address', 'changes')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('product_name', 'brand', 'model_name', 'category', 'serial_no', 'sales_no', 'has_warranty', 'is_active')
    list_filter = ('has_warranty', 'is_active', 'category')
    search_fields = ('product_name', 'brand', 'model_name', 'serial_no', 'sales_no')


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('client_name', 'contact_person', 'mobile_no', 'email_address', 'department_organization', 'sales_representative', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('client_name', 'contact_person', 'email_address')


@admin.register(CallLog)
class CallLogAdmin(admin.ModelAdmin):
    list_display = ('admin', 'client_name', 'phone_number', 'call_start', 'call_end', 'ticket')
    list_filter = ('admin',)
    search_fields = ('client_name', 'phone_number', 'notes')


@admin.register(CSATFeedback)
class CSATFeedbackAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'employee', 'admin', 'rating', 'created_at')
    list_filter = ('rating',)
    search_fields = ('comments',)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'notification_type', 'title', 'ticket', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read')
    search_fields = ('title', 'message', 'recipient__username', 'recipient__email')
    readonly_fields = ('created_at',)


@admin.register(RetentionPolicy)
class RetentionPolicyAdmin(admin.ModelAdmin):
    list_display = ('audit_log_retention_days', 'call_log_retention_days', 'updated_at', 'updated_by')
    readonly_fields = ('updated_at',)


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'announcement_type', 'visibility', 'is_active', 'start_date', 'end_date', 'created_by', 'created_at')
    list_filter = ('announcement_type', 'visibility', 'is_active')
    search_fields = ('title', 'description')
