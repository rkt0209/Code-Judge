import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { Home } from './pages/Home';
import { QuestionPage } from './pages/QuestionPage';
import { Profile } from './pages/Profile';
import { AdminProfile } from './pages/AdminProfile';
import { AdminAddQuestion } from './pages/AdminAddQuestion';
import { AdminActivity } from './pages/AdminActivity';
import { AdminManageContests } from './pages/AdminManageContests';
import { ContestsList } from './pages/ContestsList';
import { ActiveContest } from './pages/ActiveContest';
import { AuthCallback } from './pages/AuthCallback';
import { useAuth } from './context/AuthContext';
import './styles/global.css';

function AppLayout() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { role } = useAuth();

  const openAuthModal = () => setAuthModalOpen(true);
  const closeAuthModal = () => setAuthModalOpen(false);

  return (
    <div className="app-root">
      <Navbar onAuthClick={openAuthModal} />
      <AuthModal isOpen={authModalOpen} onClose={closeAuthModal} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/questions/:questionId" element={<QuestionPage onAuthClick={openAuthModal} />} />
        <Route path="/contests" element={<ContestsList />} />
        <Route path="/contest/:contestId" element={<ActiveContest onAuthClick={openAuthModal} />} />
        <Route
          path="/profile"
          element={role === 'admin' ? <AdminProfile onAuthClick={openAuthModal} /> : <Profile onAuthClick={openAuthModal} />}
        />
        <Route path="/admin/add-question" element={<AdminAddQuestion onAuthClick={openAuthModal} />} />
        <Route path="/admin/activity" element={<AdminActivity onAuthClick={openAuthModal} />} />
        <Route path="/admin/manage-contests" element={<AdminManageContests onAuthClick={openAuthModal} />} />
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
