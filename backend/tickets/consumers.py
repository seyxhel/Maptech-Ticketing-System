import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.utils import timezone


class TicketChatConsumer(AsyncJsonWebsocketConsumer):
    """WebSocket consumer for ticket chat.

    URL: ws/chat/<ticket_id>/<channel_type>/
    channel_type: client_employee | admin_employee

    Permissions:
      - client_employee: only the ticket creator (client) and the currently assigned employee
      - admin_employee: only admins and the currently assigned employee
      - Old employees (not currently assigned) are rejected.
    """

    async def connect(self):
        self.user = self.scope.get('user', AnonymousUser())
        if self.user.is_anonymous:
            await self.close()
            return

        self.ticket_id = int(self.scope['url_route']['kwargs']['ticket_id'])
        self.channel_type = self.scope['url_route']['kwargs']['channel_type']
        self.room_group_name = f'chat_{self.ticket_id}_{self.channel_type}'

        # Validate access
        allowed = await self._check_access()
        if not allowed:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Send existing messages
        messages = await self._get_messages()
        await self.send_json({'type': 'message_history', 'messages': messages})

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            # Notify others that typing stopped
            await self.channel_layer.group_send(
                self.room_group_name,
                {'type': 'typing_indicator', 'user_id': self.user.id, 'username': self.user.username, 'is_typing': False}
            )
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive_json(self, content):
        action = content.get('action')

        if action == 'send_message':
            msg_data = await self._save_message(
                content.get('content', ''),
                content.get('reply_to'),
            )
            if msg_data:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {'type': 'chat_message', 'message': msg_data}
                )

        elif action == 'typing':
            await self.channel_layer.group_send(
                self.room_group_name,
                {'type': 'typing_indicator', 'user_id': self.user.id, 'username': self.user.username, 'is_typing': content.get('is_typing', False)}
            )

        elif action == 'react':
            reaction_data = await self._toggle_reaction(
                content.get('message_id'),
                content.get('emoji', ''),
            )
            if reaction_data is not None:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {'type': 'reaction_update', 'data': reaction_data}
                )

        elif action == 'mark_read':
            read_data = await self._mark_messages_read(content.get('message_ids', []))
            if read_data:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {'type': 'read_receipt', 'data': read_data}
                )

    # ── Group send handlers ──

    async def chat_message(self, event):
        await self.send_json({'type': 'new_message', 'message': event['message']})

    async def typing_indicator(self, event):
        # Don't send typing indicator back to the sender
        if event['user_id'] != self.user.id:
            await self.send_json({
                'type': 'typing',
                'user_id': event['user_id'],
                'username': event['username'],
                'is_typing': event['is_typing'],
            })

    async def reaction_update(self, event):
        await self.send_json({'type': 'reaction_update', 'data': event['data']})

    async def read_receipt(self, event):
        await self.send_json({'type': 'read_receipt', 'data': event['data']})

    async def system_message(self, event):
        await self.send_json({'type': 'new_message', 'message': event['message']})

    async def force_disconnect(self, event):
        """Force-close this WS connection (used when employee is reassigned)."""
        await self.send_json({'type': 'force_disconnect', 'reason': event.get('reason', 'You are no longer assigned to this ticket.')})
        await self.close()

    # ── DB helpers ──

    @database_sync_to_async
    def _check_access(self):
        from .models import Ticket, User
        try:
            ticket = Ticket.objects.select_related('created_by', 'assigned_to').get(id=self.ticket_id)
        except Ticket.DoesNotExist:
            return False

        user = self.user
        if self.channel_type == 'client_employee':
            # Only ticket creator (client) or the currently assigned employee
            if user.id == ticket.created_by_id:
                return True
            if ticket.assigned_to_id and user.id == ticket.assigned_to_id:
                return True
            return False
        elif self.channel_type == 'admin_employee':
            # Only admin or the currently assigned employee
            if user.role == User.ROLE_ADMIN:
                return True
            if ticket.assigned_to_id and user.id == ticket.assigned_to_id:
                return True
            return False
        return False

    @staticmethod
    def _ensure_session(ticket):
        """Return the active AssignmentSession, auto-creating one for legacy tickets."""
        from .models import AssignmentSession
        session = AssignmentSession.objects.filter(ticket=ticket, is_active=True).first()
        if not session and ticket.assigned_to_id:
            session = AssignmentSession.objects.create(ticket=ticket, employee=ticket.assigned_to)
            ticket.current_session = session
            ticket.save(update_fields=['current_session'])
        return session

    @database_sync_to_async
    def _get_messages(self):
        from .models import Ticket, Message
        try:
            ticket = Ticket.objects.select_related('assigned_to').get(id=self.ticket_id)
        except Ticket.DoesNotExist:
            return []

        session = self._ensure_session(ticket)
        if not session:
            return []

        msgs = Message.objects.filter(
            ticket=ticket,
            channel_type=self.channel_type,
            assignment_session=session,
        ).select_related('sender', 'reply_to__sender').prefetch_related('reactions__user', 'read_receipts__user')

        return [self._serialize_message(m) for m in msgs]

    @database_sync_to_async
    def _save_message(self, content, reply_to_id=None):
        from .models import Ticket, Message
        if not content or not content.strip():
            return None
        try:
            ticket = Ticket.objects.select_related('assigned_to').get(id=self.ticket_id)
        except Ticket.DoesNotExist:
            return None

        session = self._ensure_session(ticket)
        if not session:
            return None

        reply_to = None
        if reply_to_id:
            try:
                reply_to = Message.objects.get(id=reply_to_id)
            except Message.DoesNotExist:
                pass

        msg = Message.objects.create(
            ticket=ticket,
            assignment_session=session,
            channel_type=self.channel_type,
            sender=self.user,
            content=content.strip(),
            reply_to=reply_to,
        )
        msg = Message.objects.select_related('sender', 'reply_to__sender').prefetch_related('reactions__user', 'read_receipts__user').get(id=msg.id)
        return self._serialize_message(msg)

    @database_sync_to_async
    def _toggle_reaction(self, message_id, emoji):
        from .models import Message, MessageReaction
        if not message_id or not emoji:
            return None
        try:
            msg = Message.objects.get(id=message_id)
        except Message.DoesNotExist:
            return None

        existing = MessageReaction.objects.filter(message=msg, user=self.user, emoji=emoji).first()
        if existing:
            existing.delete()
        else:
            MessageReaction.objects.create(message=msg, user=self.user, emoji=emoji)

        # Return all reactions for this message
        reactions = MessageReaction.objects.filter(message=msg).select_related('user')
        return {
            'message_id': msg.id,
            'reactions': [{'id': r.id, 'emoji': r.emoji, 'user_id': r.user.id, 'username': r.user.username} for r in reactions],
        }

    @database_sync_to_async
    def _mark_messages_read(self, message_ids):
        from .models import Message, MessageReadReceipt
        if not message_ids:
            return None
        results = []
        for mid in message_ids:
            try:
                msg = Message.objects.get(id=mid)
                obj, created = MessageReadReceipt.objects.get_or_create(message=msg, user=self.user)
                if created:
                    results.append({'message_id': mid, 'user_id': self.user.id, 'username': self.user.username, 'read_at': obj.read_at.isoformat()})
            except Message.DoesNotExist:
                continue
        return results if results else None

    def _serialize_message(self, msg):
        reactions = {}
        for r in msg.reactions.all():
            if r.emoji not in reactions:
                reactions[r.emoji] = []
            reactions[r.emoji].append({'user_id': r.user.id, 'username': r.user.username})

        read_by = [{'user_id': rr.user.id, 'username': rr.user.username, 'read_at': rr.read_at.isoformat()} for rr in msg.read_receipts.all()]

        reply_to_data = None
        if msg.reply_to:
            reply_to_data = {
                'id': msg.reply_to.id,
                'content': msg.reply_to.content[:100],
                'sender_id': msg.reply_to.sender.id,
                'sender_username': msg.reply_to.sender.username,
            }

        return {
            'id': msg.id,
            'sender_id': msg.sender.id,
            'sender_username': msg.sender.username,
            'sender_role': msg.sender.role,
            'content': msg.content,
            'reply_to': reply_to_data,
            'is_system_message': msg.is_system_message,
            'reactions': reactions,
            'read_by': read_by,
            'created_at': msg.created_at.isoformat(),
        }
