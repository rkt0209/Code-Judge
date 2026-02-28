import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { contestAPI } from '../services/api';
import { Calendar, Clock, Trophy, Users } from 'lucide-react';

export const ContestsList = () => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeContest, setActiveContest] = useState(null);

  useEffect(() => {
    fetchContests();
    if (isAuthenticated) {
      checkActiveContest();
    }
  }, [isAuthenticated]);

  const fetchContests = async () => {
    try {
      const response = await contestAPI.getAllContests();
      setContests(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch contests:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkActiveContest = async () => {
    try {
      const response = await contestAPI.getMyActiveContest();
      if (response.data.data) {
        setActiveContest(response.data.data);
      }
    } catch (err) {
      console.log('No active contest');
    }
  };

  const handleJoin = async (contest_id) => {
    if (!isAuthenticated) {
      alert('Please sign in to join contests');
      return;
    }
    try {
      console.log('Attempting to join contest:', contest_id);
      console.log('User authentication status:', isAuthenticated);
      console.log('JWT Token exists:', !!localStorage.getItem('jwt_token'));
      
      setLoading(true);
      const response = await contestAPI.joinContest(contest_id);
      console.log('Join contest response:', response);
      
      setLoading(false);
      // Only navigate if join was successful
      console.log('Navigating to:', `/contest/${contest_id}`);
      navigate(`/contest/${contest_id}`);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to join contest';
      console.error('Join error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: errorMessage
      });
      alert(errorMessage);
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: 'badge-info',
      active: 'badge-success',
      ended: 'badge-secondary'
    };
    return badges[status] || 'badge-secondary';
  };

  if (activeContest) {
    return (
      <div className="app-shell">
        <Sidebar active="contests" showFilters={false} role={role} />
        <main className="content-area">
          <div className="panel">
            <h2>You have an active contest!</h2>
            <p>{activeContest.contest.title}</p>
            <p>Time remaining: {activeContest.timeRemaining} minutes</p>
            <button className="btn btn-primary" onClick={() => navigate(`/contest/${activeContest.contest._id}`)}>
              Continue Contest
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar active="contests" showFilters={false} role={role} />
      <main className="content-area">
        <div className="content-header">
          <div>
            <h1><Trophy size={24} /> Contests</h1>
            <p>Compete with others and improve your skills</p>
          </div>
        </div>

        {loading && <div className="panel"><div className="spinner"></div></div>}

        <div className="contests-grid">
          {contests.map(contest => (
            <div key={contest._id} className="contest-card panel">
              <div className="contest-header">
                <h3>{contest.title}</h3>
                <span className={`badge ${getStatusBadge(contest.status)}`}>{contest.status}</span>
              </div>
              <p className="contest-description">{contest.description}</p>
              <div className="contest-stats">
                <span><Calendar size={14} /> {new Date(contest.start_time).toLocaleDateString()}</span>
                <span><Clock size={14} /> {contest.duration} min</span>
                <span><Trophy size={14} /> {contest.questions?.length || 0} problems</span>
                <span><Users size={14} /> {contest.participants?.length || 0} registered</span>
              </div>
              <div className="contest-actions">
                {contest.status === 'active' && (
                  <button className="btn btn-primary" onClick={() => handleJoin(contest._id)}>
                    {isAuthenticated ? 'Join Contest' : 'Sign in to Join'}
                  </button>
                )}
                {contest.status === 'upcoming' && (
                  <button className="btn btn-secondary" onClick={() => handleJoin(contest._id)}>
                    Register
                  </button>
                )}
                {contest.status === 'ended' && (
                  <button className="btn btn-secondary" onClick={() => navigate(`/contest/${contest._id}/leaderboard`)}>
                    View Leaderboard
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
