import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, SignalHigh } from 'lucide-react';
import { questionsAPI } from '../services/api';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

const difficultyRank = {
  easy: 1,
  medium: 2,
  hard: 3
};

export const Home = () => {
  const { role } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await questionsAPI.getAllQuestions();
        setQuestions(response.data.data || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch questions');
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const filteredQuestions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = questions.filter((question) => {
      const level = (question.difficulty || 'medium').toLowerCase();
      const matchesDifficulty = difficulty === 'all' || level === difficulty;
      const matchesSearch = !normalizedSearch || question.title.toLowerCase().includes(normalizedSearch);
      return matchesDifficulty && matchesSearch;
    });

    return filtered.sort((a, b) => {
      const aRank = difficultyRank[(a.difficulty || 'medium').toLowerCase()] || 2;
      const bRank = difficultyRank[(b.difficulty || 'medium').toLowerCase()] || 2;
      if (aRank !== bRank) return aRank - bRank;
      return a.title.localeCompare(b.title);
    });
  }, [questions, searchTerm, difficulty]);

  return (
    <div className="app-shell">
      <Sidebar
        active="home"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        role={role}
      />

      <main className="content-area">
        <div className="content-header">
          <div>
            <h1>Questions</h1>
            <p>Pick a challenge and start solving.</p>
          </div>
          <div className="content-meta">
            <span>{filteredQuestions.length} problems</span>
          </div>
        </div>

        {loading && (
          <div className="panel loading-panel">
            <div className="spinner"></div>
            <span>Loading questions...</span>
          </div>
        )}

        {error && (
          <div className="panel error-panel">
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && filteredQuestions.length === 0 && (
          <div className="panel empty-panel">
            <p>No questions match your filters yet.</p>
          </div>
        )}

        <div className="question-grid">
          {filteredQuestions.map((question) => (
            <button
              key={question._id}
              className="question-row"
              onClick={() => navigate(`/questions/${question._id}`)}
              type="button"
            >
              <div className="question-row-main">
                <div className="question-title">{question.title}</div>
                <div className="question-tags">
                  <span className={`difficulty-badge difficulty-${(question.difficulty || 'medium').toLowerCase()}`}>
                    {(question.difficulty || 'medium').toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="question-row-meta">
                <span>
                  <Clock size={14} />
                  {question.time_limit}s
                </span>
                <span>
                  <SignalHigh size={14} />
                  {(question.difficulty || 'medium').toLowerCase()}
                </span>
                <span>
                  <BookOpen size={14} />
                  {new Date(question.createdAt).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};
