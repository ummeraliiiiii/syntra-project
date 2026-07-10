import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditService, dashboardService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const actionLabel = (action) => String(action || '').toLowerCase().replaceAll('_', '.');

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const loadDashboard = async () => {
      setError('');

      try {
        const [statsResponse, auditResponse] = await Promise.all([
          dashboardService.getStats(),
          auditService.list({ page: 1, page_size: 4 }),
        ]);
        setStats(statsResponse.data);
        setLogs(auditResponse.data.results || auditResponse.data || []);
      } catch (err) {
        setError(err.response?.data?.detail || 'Unable to load dashboard data.');
      }
    };

    loadDashboard();
  }, []);

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Signed in as {user?.full_name || user?.email || 'Admin'} - 8 of 8 permissions granted</p>
        </div>
      </header>

      {error ? <div className="error-state">{error}</div> : null}

      <section className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total users</div>
          <div className="stat-value">{stats.total_users ?? '-'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value teal">{stats.active_users ?? '-'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Roles</div>
          <div className="stat-value">{stats.total_roles ?? '-'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Audit events</div>
          <div className="stat-value">{stats.total_audit_logs ?? '-'}</div>
        </div>
      </section>

      <section className="surface surface-pad">
        <div className="section-head">
          <div className="section-title">Recent activity</div>
          <button className="link-btn" type="button" onClick={() => navigate('/audit-logs')}>
            View audit log &gt;
          </button>
        </div>

        <table className="table">
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="mono muted tiny" style={{ width: 132 }}>{formatDate(log.created_at)}</td>
                <td style={{ width: 88 }}><span className="pill purple">{actionLabel(log.action)}</span></td>
                <td>{log.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!logs.length ? <div className="empty-state">No recent activity.</div> : null}
      </section>
    </>
  );
}
