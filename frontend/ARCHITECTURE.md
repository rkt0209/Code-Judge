# 🏗️ Frontend Architecture & Components

## 📋 Table of Contents
1. [Project Structure](#project-structure)
2. [Component Overview](#component-overview)
3. [Context & State Management](#context--state-management)
4. [Services](#services)
5. [Styling System](#styling-system)
6. [Data Flow](#data-flow)

---

## 📁 Project Structure

```
frontend/
├── node_modules/           # Dependencies
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Navbar.jsx      # Navigation bar
│   │   └── AuthModal.jsx   # Authentication modal
│   │
│   ├── context/            # React Context for global state
│   │   └── AuthContext.jsx # Authentication state management
│   │
│   ├── pages/              # Page-level components
│   │   └── Dashboard.jsx   # Main dashboard with questions & editor
│   │
│   ├── services/           # API communication
│   │   └── api.js          # Axios client & API calls
│   │
│   ├── styles/             # Global styling
│   │   └── global.css      # All CSS rules
│   │
│   ├── App.jsx             # Main App component
│   └── main.jsx            # React DOM render entry point
│
├── public/                 # Static assets
├── index.html              # HTML template
├── vite.config.js          # Vite configuration
├── package.json            # Dependencies & scripts
└── .gitignore              # Git ignore rules
```

---

## 🔧 Component Overview

### 1. **Navbar.jsx**
**Purpose:** Top navigation bar with branding and auth controls

**Props:**
- `onAuthClick` - Callback function to open auth modal

**Features:**
- Shows user name and role when authenticated
- Logout button
- Sign In button when not authenticated
- Responsive design

**Usage:**
```jsx
<Navbar onAuthClick={() => setAuthModalOpen(true)} />
```

---

### 2. **AuthModal.jsx**
**Purpose:** Modal for user to choose authentication type

**Features:**
- User login option (redirects to OAuth)
- Admin login option (redirects to OAuth)
- Close button
- Styled buttons with icons

**Usage:**
```jsx
<AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
```

---

### 3. **Dashboard.jsx**
**Purpose:** Main interface after authentication - displays questions and code editor

**Sub-components:**
- `CodeEditor` - Textarea for writing C++ code

**Props:**
- `selectedQuestion` - Currently selected question object
- `onSelectQuestion` - Callback to select a question

**State:**
- `questions` - List of all questions
- `loading` - Loading state
- `error` - Error message

**Features:**
- Fetch all questions on mount
- Click question to view details
- Real-time syntax highlighting styled editor
- Submit button with loading state
- Results display with status badges

---

### 4. **CodeEditor** (Sub-component in Dashboard)
**Purpose:** Text editor for writing C++ solutions

**Parent Props:**
- `questionId` - ID of current question

**State:**
- `code` - Current code in editor
- `loading` - Submission loading state
- `result` - Submission result

**Features:**
- Pre-filled with template code
- Syntax highlighting via CSS
- Submit button
- Results display with:
  - Status badge (ACCEPTED/WRONG/ERROR/etc)
  - Execution time
  - Time limit

---

## 🔐 Context & State Management

### AuthContext.jsx

**Purpose:** Manage authentication state globally

**Context Value:**
```javascript
{
  user: {              // User/Admin data from backend
    name: string,
    email: string,
    _id: string,
    // ... more fields
  },
  token: string,       // JWT token
  role: string,        // "user" or "admin"
  loading: boolean,    // Loading state
  isAuthenticated: boolean,  // Auth status
  login: function,     // Login handler
  logout: function     // Logout handler
}
```

**Usage:**
```javascript
const { user, token, role, login, logout, isAuthenticated } = useAuth();
```

**Features:**
- Persists token in localStorage
- Auto-restores auth on page reload
- Provides global auth state to all components

---

## 🔌 Services

### api.js

**Purpose:** Centralized API communication using Axios

**Exports:**

1. **apiClient** (Axios instance)
   - Base URL: `http://localhost:5000/api`
   - Auto-adds JWT token to all requests

2. **authAPI**
   ```javascript
   authAPI.getUserAuthUrl()    // Redirect to Google OAuth
   authAPI.getAdminAuthUrl()   // Redirect to Google OAuth
   ```

3. **questionsAPI**
   ```javascript
   questionsAPI.getAllQuestions()        // GET /user/questions
   questionsAPI.getQuestionById(id)      // GET /user/questions/:id
   ```

4. **submissionAPI**
   ```javascript
   submissionAPI.submitCode(question_id, cpp_file)    // POST /user/submission
   submissionAPI.getSubmissionHistory()               // GET /user/submission/history
   ```

5. **profileAPI**
   ```javascript
   profileAPI.getUserProfile(handle)     // GET /user/profile/handle/:handle
   profileAPI.getAllUsers()              // GET /user/profile/all
   profileAPI.changeHandle(newHandle)    // PATCH /user/profile/handle
   ```

**Interceptors:**
- Request interceptor adds JWT token from localStorage to all requests
- Automatic error handling

---

## 🎨 Styling System

### global.css

**CSS Variables (Theme Colors):**
```css
--primary: #3b82f6          /* Main brand color */
--primary-dark: #1e40af    /* Hover state */
--primary-light: #dbeafe   /* Light background */
--secondary: #10b981       /* Success color */
--danger: #ef4444          /* Error color */
--warning: #f59e0b         /* Warning color */
--text-primary: #111827    /* Main text */
--text-secondary: #6b7280  /* Secondary text */
--bg-light: #ffffff        /* Light background */
--bg-lighter: #f9fafb      /* Lighter background */
--border: #e5e7eb          /* Border color */
```

**CSS Classes:**

| Class | Purpose |
|-------|---------|
| `.navbar` | Navigation bar styling |
| `.btn` | Button base styles |
| `.btn-primary` | Primary button |
| `.btn-danger` | Danger button |
| `.modal` | Modal window styling |
| `.dashboard` | Main dashboard grid |
| `.question-card` | Individual question card |
| `.code-editor` | Code textarea |
| `.result-*` | Result status badges |

**Responsive Breakpoints:**
```css
@media (max-width: 1024px) { /* Tablet */ }
@media (max-width: 640px) { /* Mobile */ }
```

---

## 📊 Data Flow

### Authentication Flow
```
App.jsx
  ↓
[User clicks "Sign In"]
  ↓
AuthModal.jsx (opens)
  ↓
[User chooses User/Admin]
  ↓
authAPI.getUserAuthUrl() / authAPI.getAdminAuthUrl()
  ↓
[Redirected to Google OAuth]
  ↓
[Backend handles OAuth, returns to redirect URL with token in response]
  ↓
AuthContext.jsx - login() called
  ↓
[Token & user data stored in localStorage]
  ↓
App.jsx renders Dashboard (isAuthenticated = true)
```

### Question Flow
```
Dashboard.jsx (mounts)
  ↓
[useEffect calls questionsAPI.getAllQuestions()]
  ↓
[API call with JWT token from localStorage]
  ↓
[Backend returns array of questions]
  ↓
setState(questions)
  ↓
[Render question list]
  ↓
[User clicks question]
  ↓
[CodeEditor component mounts]
```

### Submission Flow
```
CodeEditor.jsx
  ↓
[User enters code and clicks Submit]
  ↓
[Code converted to Blob]
  ↓
[Blob converted to File]
  ↓
submissionAPI.submitCode(questionId, file)
  ↓
[FormData with file sent to backend with JWT]
  ↓
[Backend processes submission]
  ↓
[Results returned]
  ↓
setState(result)
  ↓
[Display verdict, execution time, etc]
```

---

## 🚀 Component Lifecycle

### App.jsx
1. **Mount**: Check for OAuth callback, setup auth
2. **Render**: Show Navbar + (Dashboard OR Landing)
3. **AuthModal**: Toggle modal based on state
4. **Unmount**: Cleanup listeners

### Dashboard.jsx
1. **Mount**: Fetch all questions
2. **Render**: Show questions list + selected question detail
3. **Update**: When question selected, show CodeEditor
4. **Submission**: Submit code and display results

---

## 📝 Development Patterns

### Making API Calls
```javascript
// In a component
import { questionsAPI } from '../services/api';

const fetchData = async () => {
  try {
    const response = await questionsAPI.getAllQuestions();
    setData(response.data.data);
  } catch (error) {
    setError(error.message);
  }
};
```

### Using Auth Context
```javascript
import { useAuth } from '../context/AuthContext';

export const MyComponent = () => {
  const { user, token, isAuthenticated, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated && <p>Hello {user.name}</p>}
    </div>
  );
};
```

### Creating New Components
```javascript
// src/components/MyComponent.jsx
import { useState, useEffect } from 'react';

export const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(null);
  
  useEffect(() => {
    // Setup
    return () => {
      // Cleanup
    };
  }, []);
  
  return <div>Component JSX</div>;
};
```

---

## 🔄 State Management Strategy

### Global State (AuthContext)
- Stores: User, token, role, auth status
- Persisted: Yes (localStorage)
- Accessed: Via `useAuth()` hook

### Local State (Components)
- Questions list in Dashboard
- Code in CodeEditor
- Results in CodeEditor
- Loading states

### No Redux/Zustand
- Simple context API is sufficient for this app
- Can be added later if needed

---

## 🐛 Debugging Tips

### Check Token
```javascript
// In browser console
localStorage.getItem('jwt_token')
JSON.parse(localStorage.getItem('user_data'))
```

### Check Network Requests
- Open DevTools → Network tab
- Filter by XHR/Fetch
- Check headers for Authorization

### Check React State
- Install React DevTools extension
- Inspect component tree
- Watch state changes in real-time

---

## 🚀 Adding New Features

### Adding a New Page
1. Create file in `src/pages/NewPage.jsx`
2. Add route in `App.jsx`
3. Import component

### Adding a New API Service
1. Add function in `src/services/api.js`
2. Use in component via import

### Adding Global State
1. Create context in `src/context/`
2. Provider wrapper in App.jsx
3. Use via hook in components

---

## 📚 Further Reading

- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/)
- [Axios Documentation](https://axios-http.com/)
- [React Context API](https://react.dev/reference/react/useContext)
