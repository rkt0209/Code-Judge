import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, Circle, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { contestAPI } from '../services/api';

export const ActiveContest = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [contest, setContest] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [code, setCode] = useState('#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    \n    return 0;\n}');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [joiningContest, setJoiningContest] = useState(false);

  useEffect(() => {
    fetchContest();
    // Refresh every 30 seconds to keep timer accurate
    const interval = setInterval(fetchContest, 30000);
    return () => clearInterval(interval);
  }, [contestId]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            alert('Contest ended!');
            navigate('/contests');
            return 0;
          }
          return prev - 1;
        });
      }, 60000); // Update every minute
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const fetchContest = async () => {
    try {
      const response = await contestAPI.getContestDetails(contestId);
      const { contest: c, participant: p, timeRemaining: tr, hasJoined: joined, status: contestStatus } = response.data.data;
      
      console.log('Contest details:', { contestStatus, joined, hasParticipant: !!p });
      
      setStatus(contestStatus);
      setHasJoined(joined);

      // Contest hasn't started yet
      if (contestStatus === 'not-started') {
        if (joined) {
          // User registered, show waiting message with success indicator
          setMessage(`You're registered! Contest starts on ${new Date(c.start_time).toLocaleString()}`);
        } else {
          // User hasn't registered, show register prompt
          setMessage('Register now to participate in this contest');
        }
        setLoading(false);
        return;
      }

      // Contest has ended
      if (contestStatus === 'ended') {
        setMessage('Contest has ended');
        setLoading(false);
        return;
      }

      // Contest is active
      if (!joined) {
        setMessage('You can still join this contest');
        setLoading(false);
        return;
      }

      // Contest is active and user is joined - show full contest
      setContest(c);
      setParticipant(p);
      setTimeRemaining(tr);
      setMessage('');
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch contest:', err);
      setMessage(err.response?.data?.message || 'Failed to load contest');
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      alert('Please write some code');
      return;
    }

    try {
      setSubmitting(true);
      const blob = new Blob([code], { type: 'text/plain' });
      const file = new File([blob], 'solution.cpp', { type: 'text/plain' });
      const currentQuestion = contest.questions[currentQuestionIndex].question_id;
      
      const response = await contestAPI.submitInContest(contestId, currentQuestion._id, file);
      setResult(response.data.results);
      
      // Refresh contest data to update status
      setTimeout(() => fetchContest(), 2000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinContest = async () => {
    try {
      setJoiningContest(true);
      console.log('Attempting to join contest with ID:', contestId);
      
      const response = await contestAPI.joinContest(contestId);
      console.log('Successfully joined contest:', response.data);
      
      // Force immediate refresh without cache
      setHasJoined(true);
      setMessage(''); 
      
      // Add a small delay then refetch (gives backend time to save)
      setTimeout(async () => {
        try {
          // Force refetch by clearing any cached responses
          await fetchContest();
        } catch (err) {
          console.error('Error refreshing:', err);
        }
        setJoiningContest(false);
      }, 800);
      
    } catch (err) {
      console.error('Failed to join contest:', err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to join contest';
      setMessage(errorMsg);
      setJoiningContest(false);
    }
  };

  const getQuestionStatus = (questionId) => {
    if (!participant) return 'unattempted';
    
    const solved = participant.solved_questions?.find(q => q.question_id.toString() === questionId);
    if (solved) return 'solved';
    
    const attempted = participant.attempted_questions?.find(q => q.question_id.toString() === questionId);
    if (attempted) return attempted.status;
    
    return 'unattempted';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'solved': return <CheckCircle size={16} className="text-success" />;
      case 'incorrect': return <XCircle size={16} className="text-error" />;
      case 'attempted': return <Circle size={16} className="text-warning" />;
      default: return <Circle size={16} className="text-secondary" />;
    }
  };

  const formatTime = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="contest-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  // Show status message if contest hasn't started, ended, or user hasn't joined
  if (message) {
    return (
      <div className="active-contest-status">
        <div className="status-card">
          <h2>{message}</h2>
          
          {status === 'not-started' && !hasJoined && (
            <div className="join-section">
              <p style={{ marginBottom: '1rem', marginTop: '1rem' }}>Be part of this contest!</p>
              <button 
                className="btn btn-primary"
                onClick={handleJoinContest}
                disabled={joiningContest}
              >
                {joiningContest ? 'Registering...' : 'Register for Contest'}
              </button>
            </div>
          )}
          
          {status === 'not-started' && hasJoined && (
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              backgroundColor: 'var(--primary-light)',
              borderRadius: '8px',
              border: '1px solid var(--primary)'
            }}>
              <p style={{ 
                color: 'var(--primary-dark)', 
                fontWeight: '500',
                margin: 0 
              }}>
                ✓ Successfully Registered
              </p>
              <p style={{ 
                marginTop: '0.5rem', 
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                margin: '0.5rem 0 0 0'
              }}>
                Contest will open at the scheduled start time.
              </p>
            </div>
          )}

          {status === 'active' && !hasJoined && (
            <div className="join-section">
              <p style={{ marginBottom: '1rem', marginTop: '1rem' }}>Join now and start solving!</p>
              <button 
                className="btn btn-primary"
                onClick={handleJoinContest}
                disabled={joiningContest}
              >
                {joiningContest ? 'Joining...' : 'Join Contest Now'}
              </button>
            </div>
          )}

          {status === 'ended' && (
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
              Thank you for participating!
            </p>
          )}
          
          <button 
            className="btn btn-secondary"
            style={{ marginTop: '1.5rem' }}
            onClick={() => navigate('/contests')}
          >
            Back to Contests
          </button>
        </div>
      </div>
    );
  }

  if (!contest) {
    return <div className="contest-loading"><div className="spinner"></div></div>;
  }

  const currentQuestion = contest.questions[currentQuestionIndex]?.question_id;

  return (
    <div className="active-contest">
      <div className="contest-topbar">
        <div className="contest-title">
          <Trophy size={20} />
          <span>{contest.title}</span>
        </div>
        <div className="contest-timer">
          <Clock size={18} />
          <span className="timer-text">{formatTime(timeRemaining)}</span>
        </div>
      </div>

      <div className="contest-layout">
        <div className={`contest-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <button 
            className="sidebar-toggle" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          
          {!sidebarCollapsed && (
            <div className="sidebar-content">
              <h3>Problems</h3>
              <div className="problems-list">
                {contest.questions.map((q, index) => {
                  const status = getQuestionStatus(q.question_id._id);
                  return (
                    <button
                      key={q.question_id._id}
                      className={`problem-item ${index === currentQuestionIndex ? 'active' : ''} status-${status}`}
                      onClick={() => {
                        setCurrentQuestionIndex(index);
                        setResult(null);
                      }}
                    >
                      <span className="problem-number">{index + 1}</span>
                      <span className="problem-title">{q.question_id.title}</span>
                      {getStatusIcon(status)}
                    </button>
                  );
                })}
              </div>
              <div className="contest-stats">
                <p>Solved: {participant?.questions_solved || 0}/{contest.questions.length}</p>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/contest/${contestId}/leaderboard`)}>
                  Leaderboard
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="contest-main">
          <div className="question-panel">
            <div className="question-header-fixed">
              <h2>{currentQuestion?.title}</h2>
              <div className="question-meta-inline">
                <span className={`difficulty-badge difficulty-${currentQuestion?.difficulty?.toLowerCase()}`}>
                  {currentQuestion?.difficulty}
                </span>
                <span><Clock size={14} /> {currentQuestion?.time_limit}s</span>
              </div>
            </div>
            <div className="question-content-scroll">
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentQuestion?.content || ''}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          <div className="code-panel">
            <label className="code-label">Your Solution</label>
            <div className="code-editor-wrapper">
              <textarea
                className="code-editor"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Write your C++ code..."
              />
            </div>
            <div className="code-actions-bar">
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>

            {result && (
              <div className={`result-box result-${result.status?.toLowerCase().replace(' ', '-')}`}>
                <h4>Result: {result.status}</h4>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
