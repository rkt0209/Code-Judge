import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

export const AdminActivity = ({ onAuthClick }) => {
  const { isAuthenticated, role } = useAuth();

  return (
    <div className="app-shell">
      <Sidebar active="activity" showFilters={false} role={role} />

      <main className="content-area">
        <div className="content-header">
          <div>
            <h1>User Activity</h1>
            <p>Track how users are engaging with your questions.</p>
          </div>
        </div>

        {!isAuthenticated || role !== 'admin' ? (
          <div className="panel empty-panel">
            <p>Admin access is required to view user activity.</p>
            <button className="btn btn-primary" onClick={onAuthClick}>
              Sign In as Admin
            </button>
          </div>
        ) : (
          <div className="panel empty-panel">
            <p>Activity analytics will be available after the contests module.</p>
          </div>
        )}
      </main>
    </div>
  );
};
