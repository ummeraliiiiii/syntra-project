from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import User, UserRole
from roles.models import Role


class RoleSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ("id", "name")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "full_name",
            "password",
        )

    def create(self, validated_data):
        password = validated_data.pop("password")

        user = User.objects.create_user(
            password=password,
            **validated_data
        )

        viewer_role, _ = Role.objects.get_or_create(
            name="Viewer",
            defaults={
                "description": "Read-only access",
            },
        )

        UserRole.objects.create(
            user=user,
            role=viewer_role,
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "full_name",
            "created_at",
        )

from .models import User


class UserManagementSerializer(serializers.ModelSerializer):
    roles = RoleSimpleSerializer(
        many=True,
        read_only=True,
    )
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    role_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
        allow_empty=True,
    )

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "full_name",
            "password",
            "is_active",
            "is_staff",
            "last_login",
            "created_at",
            "roles",
            "role_ids",
        )

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        role_ids = validated_data.pop("role_ids", [])
        user = User.objects.create_user(password=password, **validated_data)

        if role_ids:
            roles = Role.objects.filter(id__in=role_ids)
            UserRole.objects.bulk_create(
                [UserRole(user=user, role=role) for role in roles],
                ignore_conflicts=True,
            )

        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        role_ids = validated_data.pop("role_ids", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        if role_ids is not None:
            UserRole.objects.filter(user=instance).delete()
            roles = Role.objects.filter(id__in=role_ids)
            UserRole.objects.bulk_create(
                [UserRole(user=instance, role=role) for role in roles],
                ignore_conflicts=True,
            )

        return instance
class AssignRoleSerializer(serializers.Serializer):
    role_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
    )

class ChangePasswordSerializer(serializers.Serializer):

    old_password = serializers.CharField(write_only=True)

    new_password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
    )

    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):

        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                "Passwords do not match."
            )

        return attrs
    
class ForgotPasswordSerializer(serializers.Serializer):

    email = serializers.EmailField()

class ResetPasswordSerializer(serializers.Serializer):

    token = serializers.CharField()

    new_password = serializers.CharField(
        validators=[validate_password]
    )

    confirm_password = serializers.CharField()

    def validate(self, attrs):

        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                "Passwords do not match."
            )

        return attrs
