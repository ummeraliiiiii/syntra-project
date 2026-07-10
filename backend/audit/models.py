import uuid

from django.conf import settings
from django.db import models


class AuditLog(models.Model):

    ACTION_CHOICES = [
    ("CREATE", "Create"),
    ("UPDATE", "Update"),
    ("DELETE", "Delete"),
    ("LOGIN", "Login"),
    ("LOGOUT", "Logout"),
    ("ASSIGN_ROLE", "Assign Role"),
    ("ASSIGN_PERMISSION", "Assign Permission"),

    # Password actions
    ("PASSWORD_CHANGE", "Password Change"),
    ("PASSWORD_RESET_REQUEST", "Password Reset Request"),
    ("PASSWORD_RESET", "Password Reset"),
]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    module = models.CharField(max_length=100)

    action = models.CharField(
        max_length=30,
        choices=ACTION_CHOICES,
    )

    description = models.TextField(
    blank=True,
    default="",
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.action}"