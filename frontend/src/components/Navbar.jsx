import { useLocation } from 'react-router-dom';

const titles = {
  '/dashboard': 'Dashboard',
  '/users': 'Users',
  '/roles': 'Roles & Permissions',
  '/audit-logs': 'Audit Logs',
};

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="topbar">
      <div>
        <div className="page-subtitle">Administration</div>
        <div className="topbar-title">{titles[location.pathname] || 'Overview'}</div>
      </div>
      <div className="page-subtitle">Secure access management</div>
    </header>
  );
}
