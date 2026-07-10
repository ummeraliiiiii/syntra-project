import {
  Alert,
  Box,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Snackbar,
  TextField,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { roleService, userService } from '../services/apiService';

const PAGE_SIZE = 4;
const avatarColors = ['#b85b68', '#b8842a', '#7042b8', '#566074', '#0b827c', '#3268a8'];

const initials = (name = '', email = '') => {
  const value = name || email;
  return value.split(/[ @.]+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || '@';
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const blankForm = { email: '', full_name: '', password: '', is_active: true, role_ids: [] };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const visibleUsers = useMemo(() => {
    if (!role) return users;
    return users.filter((user) => user.roles?.some((item) => item.id === role));
  }, [role, users]);

  const loadUsers = useCallback(async () => {
    setError('');

    try {
      const params = { page, page_size: PAGE_SIZE };
      if (search) params.search = search;
      if (status) params.is_active = status;
      const { data } = await userService.list(params);
      setUsers(data.results || data || []);
      setCount(data.count ?? (Array.isArray(data) ? data.length : 0));
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to load users.';
      setError(message);
      setUsers([]);
      setCount(0);
    }
  }, [page, search, status]);

  useEffect(() => {
    roleService.list().then(({ data }) => setRoles(data.results || data || [])).catch(() => setRoles([]));
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setPage(1);
  }, [search, status, role]);

  const openCreate = () => {
    setSelectedUser(null);
    setForm(blankForm);
    setDialogOpen(true);
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setForm({
      email: user.email,
      full_name: user.full_name,
      password: '',
      is_active: user.is_active,
      role_ids: user.roles?.map((item) => item.id) || [],
    });
    setDialogOpen(true);
  };

  const saveUser = async (event) => {
    event.preventDefault();
    setError('');

    try {
      if (selectedUser) {
        await userService.update(selectedUser.id, {
          email: form.email,
          full_name: form.full_name,
          is_active: form.is_active,
          role_ids: form.role_ids,
        });
        setSnackbar({ open: true, message: 'User updated', severity: 'success' });
      } else {
        await userService.create(form);
        setSnackbar({ open: true, message: 'User created', severity: 'success' });
      }
      setDialogOpen(false);
      loadUsers();
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data?.email?.[0] || 'Unable to save user.';
      setError(message);
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  const toggleStatus = async (user) => {
    try {
      await userService.update(user.id, { is_active: !user.is_active });
      setSnackbar({ open: true, message: user.is_active ? 'User deactivated' : 'User activated', severity: 'success' });
      loadUsers();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Status update failed.', severity: 'error' });
    }
  };

  const toggleRole = (id) => {
    setForm((current) => ({
      ...current,
      role_ids: current.role_ids.includes(id)
        ? current.role_ids.filter((roleId) => roleId !== id)
        : [...current.role_ids, id],
    }));
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(visibleUsers.map((user) => ({
      Name: user.full_name,
      Email: user.email,
      Roles: user.roles?.map((item) => item.name).join(', ') || 'No role',
      Status: user.is_active ? 'Active' : 'Inactive',
      'Last Login': formatDate(user.last_login),
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Users_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{count} of {count} users match</p>
        </div>
        <button className="btn primary" type="button" onClick={openCreate}>+ Add user</button>
      </header>

      {error ? <div className="error-state">{error}</div> : null}

      <div className="toolbar split">
        <div className="filter-group">
          <input className="input" placeholder="Search by name or email..." value={search} onChange={(event) => setSearch(event.target.value)} />
          <select className="select" value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="">All roles</option>
            {roles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select className="select" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <button className="btn" type="button" onClick={exportToExcel}>Export to Excel</button>
      </div>

      <section className="surface">
        <table className="table">
          <thead>
            <tr>
              <th>User ^</th>
              <th>Roles</th>
              <th>Status</th>
              <th>Last login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((user, index) => (
              <tr key={user.id}>
                <td>
                  <div className="user-cell">
                    <div className="initials" style={{ background: avatarColors[index % avatarColors.length] }}>{initials(user.full_name, user.email)}</div>
                    <div>
                      <div className="user-name">{user.full_name || '-'}</div>
                      <div className="muted tiny">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>{user.roles?.map((item) => <span className="pill" key={item.id}>{item.name}</span>)}</td>
                <td><span className={`status-dot ${user.is_active ? 'status-active' : 'status-inactive'}`}>{user.is_active ? 'Active' : 'Inactive'}</span></td>
                <td className="mono tiny">{formatDate(user.last_login)}</td>
                <td>
                  <div className="action-row">
                    <button className="btn" type="button" onClick={() => openEdit(user)}>Edit</button>
                    <button className={`btn ${user.is_active ? 'danger' : 'success'}`} type="button" onClick={() => toggleStatus(user)}>
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visibleUsers.length ? <div className="empty-state">No users found.</div> : null}
        <footer className="table-footer">
          <div className="muted tiny">Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, count)} of {count} <span className="mono"> server-side - page_size={PAGE_SIZE}</span></div>
          <div className="pager">
            <button className="btn" type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Prev</button>
            <span>{page} / {totalPages}</span>
            <button className="btn" type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
          </div>
        </footer>
      </section>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedUser ? 'Edit User' : 'Add User'}</DialogTitle>
        <Box component="form" onSubmit={saveUser}>
          <DialogContent sx={{ display: 'grid', gap: 2 }}>
            <TextField label="Name" value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} required />
            <TextField label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            {!selectedUser ? <TextField label="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /> : null}
            <FormControlLabel control={<Checkbox checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />} label="Active" />
            <div>
              <div className="section-label">Roles</div>
              {roles.map((item) => (
                <FormControlLabel key={item.id} control={<Checkbox checked={form.role_ids.includes(item.id)} onChange={() => toggleRole(item.id)} />} label={item.name} />
              ))}
            </div>
          </DialogContent>
          <DialogActions>
            <button className="btn" type="button" onClick={() => setDialogOpen(false)}>Cancel</button>
            <button className="btn primary" type="submit">{selectedUser ? 'Save' : 'Create'}</button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3500} onClose={() => setSnackbar((current) => ({ ...current, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
}
