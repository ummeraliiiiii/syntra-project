from .models import AuditLog


def create_audit_log(
    *,
    user,
    module,
    action,
    description,
    ip_address=None,
):
    AuditLog.objects.create(
        user=user,
        module=module,
        action=action,
        description=description,
        ip_address=ip_address,
    )