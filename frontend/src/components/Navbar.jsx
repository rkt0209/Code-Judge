import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export const Navbar = ({ onAuthClick }) => {
  const { user, logout, isAuthenticated, role } = useAuth();

  return (
    <nav className="navbar">
      <a href="/" className="navbar-brand">
        ⚖️ Code Judge
      </a>
      <div className="navbar-right">
        {isAuthenticated ? (
          <>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {user?.name} ({role})
            </span>
            <button className="btn btn-danger btn-small" onClick={logout}>
              <LogOut size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
              Logout
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={onAuthClick}>
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};
