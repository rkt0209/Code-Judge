import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AdminAddQuestion = ({ onAuthClick }) => {
  const { isAuthenticated, role } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [timeLimit, setTimeLimit] = useState(1);
  const [difficulty, setDifficulty] = useState('medium');
  const [inputText, setInputText] = useState('');
  const [solutionText, setSolutionText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthenticated || role !== 'admin') {
      onAuthClick && onAuthClick();
      return;
    }

    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Title is required.' });
      return;
    }

    if (!content.trim()) {
      setMessage({ type: 'error', text: 'Markdown content is required.' });
      return;
    }

    if (!inputText.trim()) {
      setMessage({ type: 'error', text: 'Input file content is required.' });
      return;
    }

    if (!solutionText.trim()) {
      setMessage({ type: 'error', text: 'Solution file content is required.' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const contentFile = new File([content], 'content.md', { type: 'text/markdown' });
      const inputFile = new File([inputText], 'input.txt', { type: 'text/plain' });
      const solutionFile = new File([solutionText], 'solution.txt', { type: 'text/plain' });

      await adminAPI.createQuestion({
        title,
        content,
        tags,
        time_limit: timeLimit,
        difficulty,
        input_file: inputFile,
        solution_file: solutionFile,
        content_file: contentFile
      });

      setMessage({ type: 'success', text: 'Question created successfully.' });
      setTitle('');
      setContent('');
      setTags('');
      setTimeLimit(1);
      setDifficulty('medium');
      setInputText('');
      setSolutionText('');
    } catch (err) {
      console.error('Error creating question:', err);
      console.error('Response:', err.response);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to create question.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar active="add-question" showFilters={false} role={role} />

      <main className="content-area">
        <div className="content-header">
          <div>
            <h1>Add Question</h1>
            <p>Create a new problem using markdown and generated files.</p>
          </div>
        </div>

        {!isAuthenticated || role !== 'admin' ? (
          <div className="panel empty-panel">
            <p>Admin access is required to add questions.</p>
            <button className="btn btn-primary" onClick={onAuthClick}>
              Sign In as Admin
            </button>
          </div>
        ) : (
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="form-field">
                Title
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Sum of Two Numbers"
                />
              </label>

              <label className="form-field">
                Tags (comma-separated)
                <input
                  type="text"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="math, arrays"
                />
              </label>

              <label className="form-field">
                Time Limit (seconds)
                <input
                  type="number"
                  min="1"
                  value={timeLimit}
                  onChange={(event) => setTimeLimit(Number(event.target.value))}
                />
              </label>

              <label className="form-field">
                Difficulty
                <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
            </div>

            <label className="form-field form-field-full">
              Markdown Content
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Write the problem statement in markdown..."
                rows={10}
              />
            </label>

            <div className="form-split">
              <label className="form-field">
                Input File Content
                <textarea
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  placeholder="Sample input used for evaluation"
                  rows={6}
                />
              </label>

              <label className="form-field">
                Solution File Content
                <textarea
                  value={solutionText}
                  onChange={(event) => setSolutionText(event.target.value)}
                  placeholder="Expected output for the input"
                  rows={6}
                />
              </label>
            </div>

            {message && (
              <div className={`panel ${message.type === 'error' ? 'error-panel' : 'success-panel'}`}>
                {message.text}
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Create Question'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
};
