import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { questionsAPI, submissionAPI } from '../services/api';
import { AlertCircle, BookOpen } from 'lucide-react';

export const Dashboard = ({ selectedQuestion, onSelectQuestion }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

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

  return (
    <div className="dashboard">
      <div className="questions-list">
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            <BookOpen size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Questions ({questions.length})
          </h3>
        </div>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <span>Loading questions...</span>
          </div>
        )}

        {error && (
          <div style={{ 
            background: '#fee2e2', 
            color: '#991b1b', 
            padding: '1rem', 
            borderRadius: '0.375rem',
            display: 'flex',
            gap: '0.5rem'
          }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {!loading && questions.length === 0 && !error && (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem',
            color: 'var(--text-secondary)'
          }}>
            <p>No questions available yet</p>
          </div>
        )}

        {questions.map((question) => (
          <div
            key={question._id}
            className={`question-card ${selectedQuestion?._id === question._id ? 'active' : ''}`}
            onClick={() => onSelectQuestion(question)}
          >
            <div className="question-title">{question.title}</div>
            <div className="question-meta">
              <span className={`difficulty-badge difficulty-${question.difficulty || 'medium'}`}>
                {question.difficulty || 'medium'}
              </span>
              <span>⏱️ {question.time_limit}s</span>
            </div>
          </div>
        ))}
      </div>

      {selectedQuestion && (
        <div className="question-detail">
          <div className="question-panel">
            <h2 className="question-title-main">{selectedQuestion.title}</h2>
            <div className="question-description markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selectedQuestion.content}
              </ReactMarkdown>
            </div>
            
            <div className="question-info">
              <div className="info-item">
                <span className="info-label">Difficulty:</span>
                <span className={`difficulty-badge difficulty-${selectedQuestion.difficulty || 'medium'}`}>
                  {selectedQuestion.difficulty || 'medium'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Time Limit:</span>
                <span className="info-value">{selectedQuestion.time_limit} seconds</span>
              </div>
              <div className="info-item">
                <span className="info-label">Created:</span>
                <span className="info-value">
                  {new Date(selectedQuestion.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <CodeEditor questionId={selectedQuestion._id} />
        </div>
      )}
    </div>
  );
};

const CodeEditor = ({ questionId }) => {
  const [code, setCode] = useState(
    `#include <iostream>
using namespace std;

int main() {
    // Write your code here
    
    return 0;
}`
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!code.trim()) {
      alert('Please write some code before submitting');
      return;
    }

    try {
      setLoading(true);
      
      // Create a Blob from the code string
      const blob = new Blob([code], { type: 'text/plain' });
      const file = new File([blob], 'solution.cpp', { type: 'text/plain' });

      // Call the API
      const response = await submissionAPI.submitCode(questionId, file);
      
      setResult(response.data.results);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="code-panel">
        <label className="code-label">C++ Solution</label>
        <textarea
          className="code-editor"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Write your C++ code here..."
        />
        <div className="code-actions">
          <button 
            className="btn btn-primary btn-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ display: 'inline-block', marginRight: '0.5rem' }}></div>
                Submitting...
              </>
            ) : (
              '▶ Submit'
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className="results-panel">
          <h3 style={{ marginBottom: '1rem' }}>Submission Result</h3>
          <div className={`result-status result-${getStatusClass(result.status)}`}>
            {result.status}
          </div>
          <div className="result-detail">
            <span className="result-label">Execution Time:</span>
            <span className="result-value">{result.execution_time?.toFixed(3) || '0.000'} seconds</span>
          </div>
          <div className="result-detail">
            <span className="result-label">Time Limit:</span>
            <span className="result-value">{result.time_limit} seconds</span>
          </div>
        </div>
      )}
    </>
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
