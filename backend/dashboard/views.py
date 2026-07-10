from rest_framework.views import APIView
from rest_framework.response import Response

from common.permissions import HasPermission

from accounts.models import User
from roles.models import Role, Permission
from audit.models import AuditLog


class DashboardStatsView(APIView):

    permission_classes = [HasPermission]

    permission_map = {
        "GET": "dashboard.view",
    }

    def get(self, request):

        data = {
            "total_users": User.objects.count(),
            "active_users": User.objects.filter(is_active=True).count(),
            "inactive_users": User.objects.filter(is_active=False).count(),
            "total_roles": Role.objects.count(),
            "total_permissions": Permission.objects.count(),
            "total_audit_logs": AuditLog.objects.count(),
        }

        return Response(data)