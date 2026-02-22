import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

export const AdminContests = ({ onAuthClick }) => {
  const { isAuthenticated, role } = useAuth();

  return (
    <div className="app-shell">
      <Sidebar active="contests" showFilters={false} role={role} />

      <main className="content-area">
        <div className="content-header">
          <div>
            <h1>Create Contests</h1>
            <p>Set up coding contests for your community.</p>
          </div>
        </div>

        {!isAuthenticated || role !== 'admin' ? (
          <div className="panel empty-panel">
            <p>Admin access is required to manage contests.</p>
            <button className="btn btn-primary" onClick={onAuthClick}>
              Sign In as Admin
            </button>
          </div>
        ) : (
          <div className="panel empty-panel">
            <p>Contest creation UI will be implemented next.</p>
          </div>
        )}
      </main>
    </div>
  );
};
