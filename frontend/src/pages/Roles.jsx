import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  TextField,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { permissionService, roleService } from '../services/apiService';

const descriptions = {
  'users.view': 'See the user list',
  'users.create': 'Invite / add users',
  'users.update': 'Edit users & assign roles',
  'users.delete': 'Deactivate users',
  'roles.view': 'See roles',
  'roles.create': 'Create roles',
  'roles.update': 'Create/edit roles & permissions',
  'roles.delete': 'Remove roles',
  'permissions.view': 'See permission catalogue',
  'audit.view': 'Read the audit log',
  'dashboard.view': 'See dashboard metrics',
};

const moduleOrder = ['Users', 'Roles', 'Audit', 'Dashboard'];

const blankRole = { name: '', description: '', is_active: true };

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [roleForm, setRoleForm] = useState(blankRole);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const selectedRole = roles.find((role) => role.id === selectedRoleId) || roles[0];
  const selectedPermissionIds = useMemo(() => selectedRole?.permissions?.map((permission) => permission.id) || [], [selectedRole]);

  const groupedPermissions = useMemo(() => {
    const groups = permissions.reduce((acc, permission) => {
      const module = permission.module || 'Other';
      acc[module] = acc[module] || [];
      acc[module].push(permission);
      return acc;
    }, {});

    return Object.entries(groups).sort(([a], [b]) => {
      const first = moduleOrder.indexOf(a);
      const second = moduleOrder.indexOf(b);
      return (first === -1 ? 99 : first) - (second === -1 ? 99 : second);
    });
  }, [permissions]);

  const loadRoles = async () => {
    setError('');

    try {
      const { data } = await roleService.list();
      const nextRoles = data.results || data || [];
      setRoles(nextRoles);
      setSelectedRoleId((current) => current || nextRoles.find((role) => role.name === 'Viewer')?.id || nextRoles[0]?.id || '');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load roles.');
    }
  };

  useEffect(() => {
    loadRoles();
    permissionService.list().then(({ data }) => setPermissions(data.results || data || [])).catch(() => setPermissions([]));
  }, []);

  const saveRole = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const { data } = await roleService.create(roleForm);
      setSnackbar({ open: true, message: 'Role created', severity: 'success' });
      setDialogOpen(false);
      setRoleForm(blankRole);
      await loadRoles();
      setSelectedRoleId(data.id);
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data?.name?.[0] || 'Unable to create role.';
      setError(message);
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  const togglePermission = async (permissionId) => {
    if (!selectedRole) return;
    const nextPermissionIds = selectedPermissionIds.includes(permissionId)
      ? selectedPermissionIds.filter((id) => id !== permissionId)
      : [...selectedPermissionIds, permissionId];

    setRoles((current) => current.map((role) => {
      if (role.id !== selectedRole.id) return role;
      return {
        ...role,
        permissions: permissions.filter((permission) => nextPermissionIds.includes(permission.id)),
      };
    }));

    try {
      await roleService.assignPermissions(selectedRole.id, nextPermissionIds);
      setSnackbar({ open: true, message: 'Permissions updated', severity: 'success' });
      loadRoles();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Unable to update permissions.', severity: 'error' });
      loadRoles();
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Roles & Permissions</h1>
          <p className="page-subtitle">Changes apply immediately and are written to the audit log</p>
        </div>
        <button className="btn primary" type="button" onClick={() => setDialogOpen(true)}>+ New role</button>
      </header>

      {error ? <div className="error-state">{error}</div> : null}

      <section className="role-layout">
        <aside className="role-list">
          {roles.map((role) => (
            <button key={role.id} className={`role-row${selectedRole?.id === role.id ? ' active' : ''}`} type="button" onClick={() => setSelectedRoleId(role.id)}>
              <span className="role-name">{role.name}</span>
              <span className="muted tiny">{role.users_count ?? 0} users</span>
              <span className="role-description">{role.description || 'No description'}</span>
            </button>
          ))}
        </aside>

        <div className="surface permission-panel">
          {selectedRole ? (
            <>
              <h2 className="permission-title">{selectedRole.name}</h2>
              <p className="page-subtitle">{selectedRole.description || 'No description'}</p>

              {groupedPermissions.map(([module, items]) => (
                <div key={module}>
                  <div className="section-label" style={{ marginTop: 18 }}>{module}</div>
                  <div className="permission-grid">
                    {items.map((permission) => {
                      const checked = selectedPermissionIds.includes(permission.id);
                      return (
                        <button key={permission.id} className={`permission-tile${checked ? ' checked' : ''}`} type="button" onClick={() => togglePermission(permission.id)}>
                          <span className="check-box">{checked ? 'x' : ''}</span>
                          <span>
                            <span className="perm-code">{permission.code}</span>
                            <br />
                            <span className="muted tiny">{descriptions[permission.code] || permission.name}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="empty-state">No roles found.</div>
          )}
        </div>
      </section>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Role</DialogTitle>
        <Box component="form" onSubmit={saveRole}>
          <DialogContent sx={{ display: 'grid', gap: 2 }}>
            <TextField label="Name" value={roleForm.name} onChange={(event) => setRoleForm({ ...roleForm, name: event.target.value })} required />
            <TextField label="Description" value={roleForm.description} onChange={(event) => setRoleForm({ ...roleForm, description: event.target.value })} />
          </DialogContent>
          <DialogActions>
            <button className="btn" type="button" onClick={() => setDialogOpen(false)}>Cancel</button>
            <button className="btn primary" type="submit">Create</button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={2500} onClose={() => setSnackbar((current) => ({ ...current, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
}
