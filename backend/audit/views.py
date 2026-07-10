from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets

from common.permissions import HasPermission

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = AuditLog.objects.all()

    serializer_class = AuditLogSerializer

    permission_classes = [HasPermission]

    permission_map = {
        "GET": "audit.view",
    }

    search_fields = (
        "description",
        "user__email",
    )

    filterset_fields = (
        "module",
        "action",
    )

    ordering_fields = (
        "created_at",
    )