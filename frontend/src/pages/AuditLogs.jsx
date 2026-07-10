import { useCallback, useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { auditService } from '../services/apiService';

const PAGE_SIZE = 6;

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const actionLabel = (action) => String(action || '').toLowerCase().replaceAll('_', '.');

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [error, setError] = useState('');

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const actions = useMemo(() => Array.from(new Set(logs.map((log) => log.action).filter(Boolean))), [logs]);

  const loadLogs = useCallback(async () => {
    setError('');

    try {
      const params = { page, page_size: PAGE_SIZE };
      if (action) params.action = action;
      const { data } = await auditService.list(params);
      setLogs(data.results || data || []);
      setCount(data.count ?? (Array.isArray(data) ? data.length : 0));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load audit log.');
      setLogs([]);
      setCount(0);
    }
  }, [action, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    setPage(1);
  }, [action]);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(logs.map((log) => ({
      Timestamp: formatDate(log.created_at),
      Actor: log.user_email || '@',
      Action: actionLabel(log.action),
      Detail: log.description,
      IP: log.ip_address || '',
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Log');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Audit_Log_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-subtitle">Append-only record of every sensitive action</p>
        </div>
        <div className="filter-group">
          <select className="select" value={action} onChange={(event) => setAction(event.target.value)}>
            <option value="">All actions</option>
            {actions.map((item) => <option key={item} value={item}>{actionLabel(item)}</option>)}
          </select>
          <button className="btn" type="button" onClick={exportToExcel}>Export to Excel</button>
        </div>
      </header>

      {error ? <div className="error-state">{error}</div> : null}

      <section className="surface">
        <table className="table">
          <thead>
            <tr>
              <th>Timestamp v</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="mono tiny">{formatDate(log.created_at)}</td>
                <td>{log.user_email || '@'}</td>
                <td><span className="pill purple">{actionLabel(log.action)}</span></td>
                <td>{log.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!logs.length ? <div className="empty-state">No audit events found.</div> : null}
        <footer className="table-footer">
          <div className="muted tiny">Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, count)} of {count} <span className="mono"> server-side - page_size={PAGE_SIZE}</span></div>
          <div className="pager">
            <button className="btn" type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Prev</button>
            <span>{page} / {totalPages}</span>
            <button className="btn" type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
          </div>
        </footer>
      </section>
    </>
  );
}
