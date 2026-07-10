from django.core.management.base import BaseCommand

from roles.models import Permission

PERMISSIONS = [
    {
        "code": "users.view",
        "name": "View Users",
        "module": "Users",
    },
    {
        "code": "users.create",
        "name": "Create Users",
        "module": "Users",
    },
    {
        "code": "users.update",
        "name": "Update Users",
        "module": "Users",
    },
    {
        "code": "users.delete",
        "name": "Delete Users",
        "module": "Users",
    },
    {
        "code": "roles.view",
        "name": "View Roles",
        "module": "Roles",
    },
    {
        "code": "roles.create",
        "name": "Create Roles",
        "module": "Roles",
    },
    {
        "code": "roles.update",
        "name": "Update Roles",
        "module": "Roles",
    },
    {
        "code": "roles.delete",
        "name": "Delete Roles",
        "module": "Roles",
    },
    {
        "code": "audit.view",
        "name": "View Audit Logs",
        "module": "Audit",
    },
    {
        "code": "dashboard.view",
        "name": "View Dashboard",
        "module": "Dashboard",
    },
]


class Command(BaseCommand):
    help = "Seed default permissions"

    def handle(self, *args, **kwargs):
        for permission in PERMISSIONS:
            Permission.objects.get_or_create(
                code=permission["code"],
                defaults={
                    "name": permission["name"],
                    "module": permission["module"],
                },
            )

        self.stdout.write(
            self.style.SUCCESS("Permissions seeded successfully.")
        )