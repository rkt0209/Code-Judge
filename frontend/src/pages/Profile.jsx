import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { submissionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, XCircle, Timer, Activity } from 'lucide-react';

export const Profile = ({ onAuthClick }) => {
  const { isAuthenticated, user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        const response = await submissionAPI.getSubmissionHistory();
        setHistory(response.data.data || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch submission history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isAuthenticated]);

  const stats = useMemo(() => {
    const total = history.length;
    const accepted = history.filter((item) => item.status === 'ACCEPTED').length;
    const acceptanceRate = total ? Math.round((accepted / total) * 100) : 0;

    const solvedSet = new Set(
      history
        .filter((item) => item.status === 'ACCEPTED' && item.question_id?._id)
        .map((item) => item.question_id._id)
    );

    const difficultyCounts = history.reduce(
      (acc, item) => {
        const level = (item.question_id?.difficulty || 'medium').toLowerCase();
        acc[level] = (acc[level] || 0) + (item.status === 'ACCEPTED' ? 1 : 0);
        return acc;
      },
      { easy: 0, medium: 0, hard: 0 }
    );

    return {
      total,
      accepted,
      acceptanceRate,
      solved: solvedSet.size,
      difficultyCounts
    };
  }, [history]);

  return (
    <div className="app-shell profile-shell">
      <Sidebar active="profile" showFilters={false} />

      <main className="content-area profile-page">
        <div className="content-header">
          <div>
            <h1>{user?.name || 'User Profile'}</h1>
            <p>Track your submissions and progress.</p>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="panel empty-panel">
            <p>Please sign in to view your profile and submission history.</p>
            <button className="btn btn-primary" onClick={onAuthClick}>
              Sign In
            </button>
          </div>
        )}

        {isAuthenticated && (
          <div className="profile-layout">
            <section className="profile-history">
              <h2>Submission History</h2>

              {loading && (
                <div className="panel loading-panel">
                  <div className="spinner"></div>
                  <span>Loading submissions...</span>
                </div>
              )}

              {error && <div className="panel error-panel">{error}</div>}

              {!loading && !error && history.length === 0 && (
                <div className="panel empty-panel">No submissions yet.</div>
              )}

              <div className="history-list">
                {history.map((item) => (
                  <div key={item._id} className="history-card">
                    <div>
                      <div className="history-title">
                        {item.question_id?.title || 'Unknown Question'}
                      </div>
                      <div className="history-meta">
                        <span className={`difficulty-badge difficulty-${(item.question_id?.difficulty || 'medium').toLowerCase()}`}>
                          {(item.question_id?.difficulty || 'medium').toUpperCase()}
                        </span>
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className={`history-status status-${getStatusClass(item.status)}`}>
                      {item.status}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="profile-stats">
              <div className="stats-card">
                <h3>Stats</h3>
                <div className="stat-row">
                  <span>Questions Solved</span>
                  <strong>{stats.solved}</strong>
                </div>
                <div className="stat-row">
                  <span>Total Submissions</span>
                  <strong>{stats.total}</strong>
                </div>
                <div className="stat-row">
                  <span>Acceptance Rate</span>
                  <strong>{stats.acceptanceRate}%</strong>
                </div>
              </div>

              <div className="stats-card">
                <h3>Difficulty Breakdown</h3>
                <div className="stat-row">
                  <span>Easy</span>
                  <strong>{stats.difficultyCounts.easy}</strong>
                </div>
                <div className="stat-row">
                  <span>Medium</span>
                  <strong>{stats.difficultyCounts.medium}</strong>
                </div>
                <div className="stat-row">
                  <span>Hard</span>
                  <strong>{stats.difficultyCounts.hard}</strong>
                </div>
              </div>

              <div className="stats-card">
                <h3>Recent Verdicts</h3>
                <div className="verdict-row">
                  <CheckCircle2 size={16} />
                  <span>Accepted: {stats.accepted}</span>
                </div>
                <div className="verdict-row">
                  <XCircle size={16} />
                  <span>Wrong/Errors: {stats.total - stats.accepted}</span>
                </div>
                <div className="verdict-row">
                  <Timer size={16} />
                  <span>Pending: {history.filter((item) => item.status === 'PENDING').length}</span>
                </div>
                <div className="verdict-row">
                  <Activity size={16} />
                  <span>Active streak: Keep it going</span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

const getStatusClass = (status) => {
  switch (status) {
    case 'ACCEPTED':
      return 'accepted';
    case 'WRONG ANSWER':
      return 'wrong';
    case 'COMPILATION ERROR':
      return 'error';
    case 'TIME LIMIT EXCEEDED':
      return 'error';
    case 'PENDING':
      return 'pending';
    default:
      return 'pending';
  }
};
