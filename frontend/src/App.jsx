import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { Home } from './pages/Home';
import { QuestionPage } from './pages/QuestionPage';
import { Profile } from './pages/Profile';
import { AuthCallback } from './pages/AuthCallback';
import './styles/global.css';

function AppLayout() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const openAuthModal = () => setAuthModalOpen(true);
  const closeAuthModal = () => setAuthModalOpen(false);

  return (
    <div className="app-root">
      <Navbar onAuthClick={openAuthModal} />
      <AuthModal isOpen={authModalOpen} onClose={closeAuthModal} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/questions/:questionId" element={<QuestionPage onAuthClick={openAuthModal} />} />
        <Route path="/profile" element={<Profile onAuthClick={openAuthModal} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/*" element={<AppLayout />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
