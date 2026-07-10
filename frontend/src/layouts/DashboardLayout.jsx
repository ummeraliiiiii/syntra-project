import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-panel">
        <section className="page-shell">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
