from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):

    list_display = (
        "user",
        "module",
        "action",
        "created_at",
    )

    list_filter = (
        "module",
        "action",
    )

    search_fields = (
        "description",
        "user__email",
    )