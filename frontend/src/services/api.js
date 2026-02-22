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
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

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

export const profileAPI = {
  getUserProfile: (handle) => apiClient.get(`/user/profile/handle/${handle}`),
  getAllUsers: () => apiClient.get('/user/profile/all'),
  changeHandle: (newHandle) => apiClient.patch('/user/profile/handle', { handle: newHandle }),
};

export default apiClient;
