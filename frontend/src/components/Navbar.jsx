import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

export const Navbar = ({ onAuthClick }) => {
  const { user, logout, isAuthenticated, role } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleProfileClick = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  const handleProfile = () => {
    navigate('/profile');
    setMenuOpen(false);
  };

  return (
    <nav className="topbar">
      <a href="/" className="topbar-brand">
        Code Judge
      </a>
      <div className="topbar-right">
        {isAuthenticated ? (
          <div className="profile-menu">
            <button className="profile-button" onClick={handleProfileClick} type="button">
              <span className="profile-avatar">
                {user?.name?.charAt(0) || 'U'}
              </span>
              <span className="profile-meta">
                <span className="profile-name">{user?.name || 'User'}</span>
                <span className="profile-role">{role}</span>
              </span>
            </button>
            {menuOpen && (
              <div className="profile-dropdown">
                <button type="button" onClick={handleProfile}>
                  <User size={14} />
                  View Profile
                </button>
                <button type="button" onClick={handleLogout} className="danger">
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="btn btn-primary" onClick={onAuthClick}>
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};
