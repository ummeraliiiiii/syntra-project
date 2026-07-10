from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import HasPermission
from audit.utils import create_audit_log
from .models import Role, Permission,  RolePermission
from .serializers import (
    RoleSerializer,
    PermissionSerializer,
    AssignPermissionSerializer,
)


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all().order_by("name")
    serializer_class = RoleSerializer
    permission_classes = [HasPermission]

    permission_map = {
    "GET": "roles.view",
    "POST": "roles.create",
    "PUT": "roles.update",
    "PATCH": "roles.update",
    "DELETE": "roles.delete",
    }

    @action(detail=True, methods=["post"])
    def assign_permissions(self, request, pk=None):
        role = self.get_object()

        serializer = AssignPermissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        permission_ids = serializer.validated_data["permission_ids"]
        RolePermission.objects.filter(role=role).delete()
        permissions = Permission.objects.filter(id__in=permission_ids)

        for permission in permissions:
            RolePermission.objects.create(
                role=role,
                permission=permission,
            )

        create_audit_log(
            user=request.user,
            module="Roles",
            action="ASSIGN_PERMISSION",
            description=f"Updated permissions for {role.name}",
            ip_address=request.META.get("REMOTE_ADDR"),
        )
    
        return Response(
            {"message": "Permissions assigned successfully."}
        )

class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permission.objects.all().order_by("module", "name")
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated]
