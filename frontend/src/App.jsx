import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './pages/Dashboard';
import { AuthCallback } from './pages/AuthCallback';
import './styles/global.css';

function AppContent() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const { isAuthenticated } = useAuth();

  return (
    <div>
      <Navbar onAuthClick={() => setAuthModalOpen(true)} />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      
      {isAuthenticated ? (
        <Dashboard 
          selectedQuestion={selectedQuestion}
          onSelectQuestion={setSelectedQuestion}
        />
      ) : (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 70px)',
          textAlign: 'center'
        }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Welcome to Code Judge</h1>
            <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              A secure online judge platform for coding contests
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => setAuthModalOpen(true)}
              style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
            >
              Get Started - Sign In
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/" element={<AppContent />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
