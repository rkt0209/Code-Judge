import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { adminAPI, questionsAPI } from '../services/api';
import { Calendar, Clock, Plus, Trash2, Edit2 } from 'lucide-react';

export const AdminManageContests = ({ onAuthClick }) => {
  const { isAuthenticated, role } = useAuth();
  const [contests, setContests] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingContestId, setEditingContestId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    duration: 120,
    question_ids: []
  });

  useEffect(() => {
    if (isAuthenticated && role === 'admin') {
      fetchContests();
      fetchQuestions();
    }
  }, [isAuthenticated, role]);

  const fetchContests = async () => {
    try {
      const response = await adminAPI.getAllContests();
      setContests(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch contests:', err);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await questionsAPI.getAllQuestions();
      setQuestions(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.start_time || !formData.end_time) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    try {
      setLoading(true);
      if (editingContestId) {
        // Update existing contest
        await adminAPI.updateContest(editingContestId, formData);
        setMessage({ type: 'success', text: 'Contest updated successfully' });
        setEditingContestId(null);
      } else {
        // Create new contest
        await adminAPI.createContest(formData);
        setMessage({ type: 'success', text: 'Contest created successfully' });
      }
      setShowCreateForm(false);
      setFormData({ title: '', description: '', start_time: '', end_time: '', duration: 120, question_ids: [] });
      fetchContests();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save contest' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contest_id) => {
    if (!confirm('Delete this contest?')) return;
    try {
      await adminAPI.deleteContest(contest_id);
      setMessage({ type: 'success', text: 'Contest deleted' });
      fetchContests();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete contest' });
    }
  };

  const handleEdit = (contest) => {
    const now = new Date();
    const startTime = new Date(contest.start_time);
    
    if (now >= startTime) {
      setMessage({ type: 'error', text: 'Cannot edit contest after it has started' });
      return;
    }

    // Format datetime for datetime-local input
    const formatDateTime = (dateString) => {
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16);
    };

    setEditingContestId(contest._id);
    setFormData({
      title: contest.title,
      description: contest.description,
      start_time: formatDateTime(contest.start_time),
      end_time: formatDateTime(contest.end_time),
      duration: contest.duration,
      question_ids: contest.questions.map(q => q.question_id ? q.question_id._id : q._id) || []
    });
    setShowCreateForm(true);
  };

  const canEditContest = (contest) => {
    const now = new Date();
    const startTime = new Date(contest.start_time);
    return now < startTime;
  };

  const toggleQuestion = (qid) => {
    setFormData(prev => ({
      ...prev,
      question_ids: prev.question_ids.includes(qid)
        ? prev.question_ids.filter(id => id !== qid)
        : [...prev.question_ids, qid]
    }));
  };

  if (!isAuthenticated || role !== 'admin') {
    return (
      <div className="app-shell">
        <Sidebar active="manage-contests" showFilters={false} role={role} />
        <main className="content-area">
          <div className="panel empty-panel">
            <p>Admin access required</p>
            <button className="btn btn-primary" onClick={onAuthClick}>Sign In as Admin</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar active="manage-contests" showFilters={false} role={role} />
      <main className="content-area">
        <div className="content-header">
          <div>
            <h1>Manage Contests</h1>
            <p>Create and manage coding contests</p>
          </div>
          <button className="btn btn-primary" onClick={() => {
            setEditingContestId(null);
            setFormData({ title: '', description: '', start_time: '', end_time: '', duration: 120, question_ids: [] });
            setShowCreateForm(!showCreateForm);
          }}>
            <Plus size={16} />
            {showCreateForm ? 'Cancel' : 'Create Contest'}
          </button>
        </div>

        {message && (
          <div className={`panel ${message.type === 'error' ? 'error-panel' : 'success-panel'}`}>
            {message.text}
          </div>
        )}

        {showCreateForm && (
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="form-field">
                Title *
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contest Title"
                />
              </label>
              <label className="form-field">
                Duration (minutes) *
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                  min="1"
                />
              </label>
            </div>

            <label className="form-field">
              Description
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Contest description..."
              />
            </label>

            <div className="form-grid">
              <label className="form-field">
                Start Time *
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </label>
              <label className="form-field">
                End Time *
                <input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </label>
            </div>

            <div className="form-field">
              <label>Select Questions</label>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
                {questions.map(q => (
                  <label key={q._id} style={{ display: 'block', marginBottom: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.question_ids.includes(q._id)}
                      onChange={() => toggleQuestion(q._id)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    {q.title} ({q.difficulty})
                  </label>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? (editingContestId ? 'Updating...' : 'Creating...') : (editingContestId ? 'Update Contest' : 'Create Contest')}
            </button>
          </form>
        )}

        <div className="contests-list">
          {contests.map(contest => (
            <div key={contest._id} className="contest-card panel">
              <div className="contest-card-header">
                <h3>{contest.title}</h3>
                <div className="contest-actions">
                  {canEditContest(contest) && (
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => handleEdit(contest)}
                      title="Edit contest"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => handleDelete(contest._id)}
                    title="Delete contest"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p>{contest.description}</p>
              <div className="contest-meta">
                <span><Calendar size={14} /> {new Date(contest.start_time).toLocaleString()}</span>
                <span><Clock size={14} /> {contest.duration} min</span>
                <span>{contest.questions?.length || 0} questions</span>
                <span>{contest.participants?.length || 0} participants</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
