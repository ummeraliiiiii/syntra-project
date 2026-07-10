from rest_framework import serializers

from .models import Role, Permission


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = "__all__"


class RoleSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()
    users_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = (
            "id",
            "name",
            "description",
            "is_active",
            "permissions",
            "users_count",
        )

    def get_permissions(self, obj):
        permissions = Permission.objects.filter(
            rolepermission__role=obj
        )
        return PermissionSerializer(permissions, many=True).data

    def get_users_count(self, obj):
        return obj.userrole_set.count()
    
class AssignPermissionSerializer(serializers.Serializer):
    permission_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
    )

