from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_CLIENT = 'client'
    ROLE_EMPLOYEE = 'employee'
    ROLE_ADMIN = 'admin'
    ROLE_CHOICES = [
        (ROLE_CLIENT, 'Client'),
        (ROLE_EMPLOYEE, 'Employee'),
        (ROLE_ADMIN, 'Admin'),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=ROLE_CLIENT)
    middle_name = models.CharField(max_length=150, blank=True)
    suffix = models.CharField(max_length=3, blank=True)
    phone = models.CharField(max_length=13, blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class Ticket(models.Model):
    STATUS_OPEN = 'open'
    STATUS_CLOSED = 'closed'
    STATUS_ESCALATED = 'escalated'
    STATUS_CHOICES = [
        (STATUS_OPEN, 'Open'),
        (STATUS_CLOSED, 'Closed'),
        (STATUS_ESCALATED, 'Escalated'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_OPEN)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='created_tickets', on_delete=models.CASCADE)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='assigned_tickets', null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.status})"


class Template(models.Model):
    # Admin-created template with newline-separated steps
    name = models.CharField(max_length=200)
    steps = models.TextField(blank=True)

    def __str__(self):
        return self.name


class TicketTask(models.Model):
    STATUS_TODO = 'todo'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_DONE = 'done'
    STATUS_CHOICES = [
        (STATUS_TODO, 'To Do'),
        (STATUS_IN_PROGRESS, 'In Progress'),
        (STATUS_DONE, 'Done'),
    ]

    ticket = models.ForeignKey(Ticket, related_name='tasks', on_delete=models.CASCADE)
    description = models.CharField(max_length=500)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_TODO)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Task for {self.ticket.title}: {self.description[:30]}"
