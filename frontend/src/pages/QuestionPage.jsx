import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { questionsAPI, submissionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const QuestionPage = ({ onAuthClick }) => {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [code, setCode] = useState(
    `#include <iostream>
using namespace std;

int main() {
    // Write your code here
    
    return 0;
}`
  );
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        const response = await questionsAPI.getQuestionById(questionId);
        setQuestion(response.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch question');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [questionId]);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      onAuthClick && onAuthClick();
      return;
    }

    if (!code.trim()) {
      alert('Please write some code before submitting');
      return;
    }

    try {
      setSubmitting(true);
      setResult(null); // Clear previous result
      const blob = new Blob([code], { type: 'text/plain' });
      const file = new File([blob], 'solution.cpp', { type: 'text/plain' });
      console.log('Submitting code for question:', questionId);
      console.log('File created:', file.name, file.size, 'bytes');
      const response = await submissionAPI.submitCode(questionId, file);
      console.log('Submission response:', response.data);
      setResult(response.data.results);
    } catch (err) {
      console.error('Submission error:', err);
      console.error('Error response:', err.response);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to submit code';
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="question-page">
      <div className="question-topbar">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {loading && (
        <div className="panel loading-panel">
          <div className="spinner"></div>
          <span>Loading question...</span>
        </div>
      )}

      {error && (
        <div className="panel error-panel">
          <span>{error}</span>
        </div>
      )}

      {question && (
        <div className="question-split">
          <section className="question-left">
            <div className="question-header">
              <h1>{question.title}</h1>
              <div className="question-meta-grid">
                <div>
                  <span className="meta-label">Difficulty</span>
                  <span className={`difficulty-badge difficulty-${(question.difficulty || 'medium').toLowerCase()}`}>
                    {(question.difficulty || 'medium').toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="meta-label">Time Limit</span>
                  <span className="meta-value">
                    <Clock size={14} />
                    {question.time_limit}s
                  </span>
                </div>
                <div>
                  <span className="meta-label">Added</span>
                  <span className="meta-value">
                    <FileText size={14} />
                    {new Date(question.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="question-content-scrollable">
              <div className="question-description markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {question.content}
                </ReactMarkdown>
              </div>
            </div>
          </section>

          <section className="question-right">
            <div className="editor-card">
              <label className="code-label">Write your C++ solution</label>
              <div className="code-editor-container">
                <textarea
                  className="code-editor"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Write your C++ code here..."
                />
              </div>
              <div className="code-actions-sticky">
                <div className="code-actions">
                  <button
                    className="btn btn-primary btn-submit"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="spinner" style={{ display: 'inline-block', marginRight: '0.5rem' }}></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit'
                    )}
                  </button>
                </div>
                {!isAuthenticated && (
                  <p className="auth-hint">
                    Sign in to submit solutions. Viewing questions is open to all users.
                  </p>
                )}
              </div>
            </div>

            {result && (
              <div className="results-panel">
                <h3>Submission Result</h3>
                <div className={`result-status result-${getStatusClass(result.status)}`}>
                  {result.status}
                </div>
                <div className="result-detail">
                  <span className="result-label">Execution Time:</span>
                  <span className="result-value">
                    {result.execution_time?.toFixed(3) || '0.000'} seconds
                  </span>
                </div>
                <div className="result-detail">
                  <span className="result-label">Time Limit:</span>
                  <span className="result-value">{result.time_limit} seconds</span>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
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
