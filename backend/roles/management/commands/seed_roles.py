from django.core.management.base import BaseCommand

from roles.models import Role

ROLES = [
    {
        "name": "Super Admin",
        "description": "Full system access",
    },
    {
        "name": "Admin",
        "description": "Manage users and roles",
    },
    {
        "name": "Manager",
        "description": "Manage assigned users",
    },
    {
        "name": "Viewer",
        "description": "Read-only access",
    },
]


class Command(BaseCommand):
    help = "Seed default roles"

    def handle(self, *args, **kwargs):
        for role in ROLES:
            Role.objects.get_or_create(
                name=role["name"],
                defaults={
                    "description": role["description"],
                },
            )

        self.stdout.write(
            self.style.SUCCESS("Roles seeded successfully.")
        )