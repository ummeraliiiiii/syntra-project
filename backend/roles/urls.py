from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    RoleViewSet,
    PermissionViewSet,
)

router = DefaultRouter()

router.register("roles", RoleViewSet)
router.register("permissions", PermissionViewSet)

urlpatterns = [
    path("", include(router.urls)),
]