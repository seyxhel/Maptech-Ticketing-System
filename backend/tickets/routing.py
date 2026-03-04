from django.urls import re_path
from .consumers import TicketChatConsumer, NotificationConsumer

websocket_urlpatterns = [
    re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
    re_path(r'ws/chat/(?P<ticket_id>\d+)/(?P<channel_type>admin_employee)/$', TicketChatConsumer.as_asgi()),
]
