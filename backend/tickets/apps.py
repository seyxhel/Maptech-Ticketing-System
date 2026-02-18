from django.apps import AppConfig


class TicketsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tickets'
    def ready(self):
        # import signals to ensure initial admin creation
        try:
            import tickets.signals  # noqa: F401
        except Exception:
            pass
