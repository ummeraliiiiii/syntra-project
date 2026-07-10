import api from '../api/axios';

export const authService = {
  login: (payload) => api.post('token/', payload),
  refresh: (refreshToken) => api.post('token/refresh/', { refresh: refreshToken }),
  register: (payload) => api.post('auth/register/', payload),
  me: () => api.get('auth/me/'),
};

export const dashboardService = {
  getStats: () => api.get('dashboard/'),
};

export const userService = {
  list: (params = {}) => api.get('users/', { params }),
  create: (payload) => api.post('users/', payload),
  update: (id, payload) => api.patch(`users/${id}/`, payload),
  remove: (id) => api.delete(`users/${id}/`),
  assignRoles: (id, roleIds) => api.post(`users/${id}/assign-roles/`, { role_ids: roleIds }),
};

export const roleService = {
  list: (params = {}) => api.get('roles/', { params }),
  create: (payload) => api.post('roles/', payload),
  update: (id, payload) => api.patch(`roles/${id}/`, payload),
  remove: (id) => api.delete(`roles/${id}/`),
  assignPermissions: (id, permissionIds) => api.post(`roles/${id}/assign_permissions/`, { permission_ids: permissionIds }),
};

export const permissionService = {
  list: (params = {}) => api.get('permissions/', { params }),
};

export const auditService = {
  list: (params = {}) => api.get('audit-logs/', { params }),
};
