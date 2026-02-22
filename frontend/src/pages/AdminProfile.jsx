import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { adminAPI, questionsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AdminProfile = ({ onAuthClick }) => {
  const { isAuthenticated, role, user } = useAuth();
  const [adminData, setAdminData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!isAuthenticated || role !== 'admin') return;
      try {
        setLoading(true);
        const [adminResponse, questionsResponse] = await Promise.all([
          adminAPI.getMyProfile(),
          questionsAPI.getAllQuestions()
        ]);
        setAdminData(adminResponse.data.data);
        setQuestions(questionsResponse.data.data || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load admin profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [isAuthenticated, role]);

  const questionStats = useMemo(() => {
    const createdIds = new Set((adminData?.questions_created || []).map((item) => String(item.question_id || item)));
    const adminQuestions = questions.filter((q) => createdIds.has(String(q._id)) || createdIds.size === 0);

    const difficultyCounts = adminQuestions.reduce(
      (acc, item) => {
        const level = (item.difficulty || 'medium').toLowerCase();
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      },
      { easy: 0, medium: 0, hard: 0 }
    );

    const recentQuestions = [...adminQuestions]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    return {
      total: adminQuestions.length,
      difficultyCounts,
      recentQuestions
    };
  }, [adminData, questions]);

  return (
    <div className="app-shell admin-shell">
      <Sidebar active="profile" showFilters={false} role={role} />

      <main className="content-area admin-profile">
        <div className="content-header">
          <div>
            <h1>{user?.name || 'Admin Profile'}</h1>
            <p>Manage questions and contest activity.</p>
          </div>
        </div>

        {!isAuthenticated || role !== 'admin' ? (
          <div className="panel empty-panel">
            <p>Admin access is required to view this profile.</p>
            <button className="btn btn-primary" onClick={onAuthClick}>
              Sign In as Admin
            </button>
          </div>
        ) : (
          <div className="admin-profile-stack">
            {loading && (
              <div className="panel loading-panel">
                <div className="spinner"></div>
                <span>Loading admin details...</span>
              </div>
            )}

            {error && <div className="panel error-panel">{error}</div>}

            {!loading && !error && (
              <>
                <section className="panel admin-section">
                  <h2>Question Overview</h2>
                  <div className="stats-row">
                    <div>
                      <span>Total Questions</span>
                      <strong>{questionStats.total}</strong>
                    </div>
                    <div>
                      <span>Easy</span>
                      <strong>{questionStats.difficultyCounts.easy}</strong>
                    </div>
                    <div>
                      <span>Medium</span>
                      <strong>{questionStats.difficultyCounts.medium}</strong>
                    </div>
                    <div>
                      <span>Hard</span>
                      <strong>{questionStats.difficultyCounts.hard}</strong>
                    </div>
                  </div>
                </section>

                <section className="panel admin-section">
                  <h2>Recently Added Questions</h2>
                  {questionStats.recentQuestions.length === 0 ? (
                    <p className="muted-text">No questions added yet.</p>
                  ) : (
                    <ul className="simple-list">
                      {questionStats.recentQuestions.map((question) => (
                        <li key={question._id}>
                          <span>{question.title}</span>
                          <span className={`difficulty-badge difficulty-${(question.difficulty || 'medium').toLowerCase()}`}>
                            {(question.difficulty || 'medium').toUpperCase()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="panel admin-section">
                  <h2>Contest Overview</h2>
                  <div className="stats-row">
                    <div>
                      <span>Total Contests</span>
                      <strong>{adminData?.contests_created?.length || 0}</strong>
                    </div>
                  </div>
                </section>

                <section className="panel admin-section">
                  <h2>Recent Contests</h2>
                  <p className="muted-text">Contest management will be added next.</p>
                </section>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
