import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const AuthCallback = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Get token from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const user = params.get('user');
    const role = params.get('role');

    if (token && user && role) {
      try {
        // Parse user data
        const userData = JSON.parse(user);
        
        // Store in context and localStorage
        login(token, role, userData);
        
        // Redirect to dashboard
        navigate('/', { replace: true });
      } catch (error) {
        console.error('Error processing auth callback:', error);
        navigate('/', { replace: true });
      }
    } else {
      // No token provided, go back to home
      navigate('/', { replace: true });
    }
  }, [login, navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div className="spinner" style={{ width: '3rem', height: '3rem' }}></div>
      <p style={{ color: 'var(--text-secondary)' }}>Signing you in...</p>
    </div>
  );
};
