from rest_framework import generics, viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from common.permissions import HasPermission
from audit.utils import create_audit_log

from .models import User, UserRole
from roles.models import Role

from .serializers import (
    RegisterSerializer,
    UserSerializer,
    UserManagementSerializer,
    ChangePasswordSerializer,
    AssignRoleSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user

        if not user.check_password(
            serializer.validated_data["old_password"]
        ):
            return Response(
                {
                    "detail": "Old password is incorrect."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(
            serializer.validated_data["new_password"]
        )
        user.save()

        create_audit_log(
            user=user,
            module="Authentication",
            action="UPDATE",
            description="Password changed",
            ip_address=request.META.get("REMOTE_ADDR"),
        )

        return Response(
            {
                "message": "Password changed successfully."
            },
            status=status.HTTP_200_OK,
        )


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("-created_at")
    serializer_class = UserManagementSerializer
    permission_classes = [HasPermission]

    permission_map = {
        "GET": "users.view",
        "POST": "users.create",
        "PUT": "users.update",
        "PATCH": "users.update",
        "DELETE": "users.delete",
    }

    filter_backends = [
    DjangoFilterBackend,
    SearchFilter,
    OrderingFilter,
    ]

    search_fields = (
        "email",
        "full_name",
    )

    ordering_fields = (
        "email",
        "created_at",
    )

    filterset_fields = (
        "is_active",
        "is_staff",
    )

    @action(
        detail=True,
        methods=["post"],
        url_path="assign-roles",
    )
    def assign_roles(self, request, pk=None):
        user = self.get_object()

        serializer = AssignRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        role_ids = serializer.validated_data["role_ids"]

        UserRole.objects.filter(user=user).delete()

        roles = Role.objects.filter(id__in=role_ids)

        user_roles = [
            UserRole(
                user=user,
                role=role,
            )
            for role in roles
        ]

        UserRole.objects.bulk_create(user_roles)

        create_audit_log(
            user=request.user,
            module="Users",
            action="ASSIGN_ROLE",
            description=f"Assigned roles to {user.email}",
            ip_address=request.META.get("REMOTE_ADDR"),
        )

        return Response(
            {"message": "Roles assigned successfully."},
            status=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)

        email = response.data.get("email", "Unknown")

        create_audit_log(
            user=request.user,
            module="Users",
            action="CREATE",
            description=f"Created user: {email}",
            ip_address=request.META.get("REMOTE_ADDR"),
        )

        return response

    def update(self, request, *args, **kwargs):
        user = self.get_object()

        response = super().update(request, *args, **kwargs)

        create_audit_log(
            user=request.user,
            module="Users",
            action="UPDATE",
            description=f"Updated user: {user.email}",
            ip_address=request.META.get("REMOTE_ADDR"),
        )

        return response

    def partial_update(self, request, *args, **kwargs):
        user = self.get_object()

        response = super().partial_update(request, *args, **kwargs)

        create_audit_log(
            user=request.user,
            module="Users",
            action="UPDATE",
            description=f"Updated user: {user.email}",
            ip_address=request.META.get("REMOTE_ADDR"),
        )

        return response

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        email = user.email

        response = super().destroy(request, *args, **kwargs)

        create_audit_log(
            user=request.user,
            module="Users",
            action="DELETE",
            description=f"Deleted user: {email}",
            ip_address=request.META.get("REMOTE_ADDR"),
        )

        return response
    