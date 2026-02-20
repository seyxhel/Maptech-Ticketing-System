from django.urls import re_path
from .consumers import TicketChatConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<ticket_id>\d+)/(?P<channel_type>client_employee|admin_employee)/$', TicketChatConsumer.as_asgi()),
]
