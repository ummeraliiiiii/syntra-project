from rest_framework.permissions import BasePermission

from accounts.models import UserRole
from roles.models import RolePermission


class HasPermission(BasePermission):

    def has_permission(self, request, view):

        permission_map = getattr(view, "permission_map", {})

        required_permission = permission_map.get(request.method)

        if required_permission is None:
            return True

        user = request.user

        if not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        role_ids = UserRole.objects.filter(
            user=user
        ).values_list(
            "role_id",
            flat=True,
        )

        return RolePermission.objects.filter(
            role_id__in=role_ids,
            permission__code=required_permission,
        ).exists()