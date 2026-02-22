import { X } from 'lucide-react';
import { authAPI } from '../services/api';

export const AuthModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleUserLogin = () => {
    authAPI.getUserAuthUrl();
  };

  const handleAdminLogin = () => {
    authAPI.getAdminAuthUrl();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Sign In</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Choose your account type to continue
          </p>
          <div className="auth-options">
            <button 
              className="auth-button auth-button-user" 
              onClick={handleUserLogin}
            >
              👤 Sign In as User
            </button>
            <button 
              className="auth-button auth-button-admin" 
              onClick={handleAdminLogin}
            >
              🔐 Sign In as Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
