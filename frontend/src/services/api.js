import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  const role = localStorage.getItem('user_role');
  
  console.log('API Request:', {
    url: config.url,
    method: config.method,
    hasToken: !!token,
    role: role
  });
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Disable caching for contest endpoints
  if (config.url && config.url.includes('/contest/') && config.method === 'get') {
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
  }
  
  return config;
});

// Add response interceptor for debugging
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export const authAPI = {
  getUserAuthUrl: () => {
    window.location.href = `${API_BASE_URL}/user/auth`;
  },
  getAdminAuthUrl: () => {
    window.location.href = `${API_BASE_URL}/admin/auth`;
  },
};

export const questionsAPI = {
  getAllQuestions: () => apiClient.get('/user/questions'),
  getQuestionById: (question_id) => apiClient.get(`/user/questions/${question_id}`),
};

export const submissionAPI = {
  submitCode: (question_id, cpp_file) => {
    const formData = new FormData();
    formData.append('question_id', question_id);
    formData.append('submission_file', cpp_file);

    return apiClient.post('/user/submission', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getSubmissionHistory: () => apiClient.get('/user/submission/history'),
};

export const adminAPI = {
  getMyProfile: () => apiClient.get('/admin/profile/my'),
  createQuestion: (payload) => {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('content', payload.content || '');
    formData.append('tags', payload.tags || '');
    formData.append('time_limit', payload.time_limit || 1);
    formData.append('difficulty', payload.difficulty || 'medium');
    formData.append('input_file', payload.input_file);
    formData.append('solution_file', payload.solution_file);
    formData.append('content_file', payload.content_file);

    return apiClient.post('/admin/question/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  createContest: (payload) => apiClient.post('/admin/contest/create', payload),
  getAllContests: () => apiClient.get('/admin/contest/'),
  getContestById: (contest_id) => apiClient.get(`/admin/contest/${contest_id}`),
  addQuestionsToContest: (contest_id, question_ids) => 
    apiClient.post(`/admin/contest/${contest_id}/questions`, { question_ids }),
  updateContest: (contest_id, payload) => apiClient.patch(`/admin/contest/${contest_id}`, payload),
  deleteContest: (contest_id) => apiClient.delete(`/admin/contest/${contest_id}`)
};

export const profileAPI = {
  getUserProfile: (handle) => apiClient.get(`/user/profile/handle/${handle}`),
  getAllUsers: () => apiClient.get('/user/profile/all'),
  changeHandle: (newHandle) => apiClient.patch('/user/profile/handle', { handle: newHandle }),
};

export const contestAPI = {
  getAllContests: () => apiClient.get('/user/contest/'),
  joinContest: (contest_id) => apiClient.post(`/user/contest/${contest_id}/join`),
  getMyActiveContest: () => apiClient.get('/user/contest/active'),
  getContestDetails: (contest_id) => apiClient.get(`/user/contest/${contest_id}`),
  submitInContest: (contest_id, question_id, cpp_file) => {
    const formData = new FormData();
    formData.append('contest_id', contest_id);
    formData.append('question_id', question_id);
    formData.append('submission_file', cpp_file);

    return apiClient.post('/user/contest/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getLeaderboard: (contest_id) => apiClient.get(`/user/contest/${contest_id}/leaderboard`)
};

export default apiClient;
