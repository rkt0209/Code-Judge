# Code Judge Frontend

A modern React-based frontend for the Code Judge online judge platform.

## 🚀 Features

- **Dashboard View**: Browse all available coding problems
- **Code Editor**: Write C++ solutions with syntax-aware editor
- **Real-time Results**: See submission verdicts instantly
- **OAuth Authentication**: Secure Google sign-in for users and admins
- **Token Management**: Automatic JWT token storage and handling
- **Responsive Design**: Works seamlessly on desktop and tablet

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Fast build tool and dev server
- **Axios** - HTTP client
- **Lucide React** - Beautiful icons
- **CSS3** - Styled components

## 📋 Prerequisites

- Node.js (v16+)
- npm or yarn

## 🔧 Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3030`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Navbar.jsx
│   │   └── AuthModal.jsx
│   ├── context/            # React context
│   │   └── AuthContext.jsx
│   ├── pages/             # Page components
│   │   └── Dashboard.jsx
│   ├── services/          # API services
│   │   └── api.js
│   ├── styles/            # CSS styles
│   │   └── global.css
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── .gitignore
```

## 🔐 Authentication Flow

1. **Click "Sign In"** - Opens modal with user/admin options
2. **Select User/Admin** - Redirects to Google OAuth
3. **Sign in with Google** - Backend redirects back with JWT token
4. **Token Storage** - JWT automatically stored in localStorage
5. **Dashboard Access** - Can now view questions and submit solutions

## 💻 Usage

### View Questions
- Dashboard displays all available questions
- Click any question to view details
- Difficulty badges and time limits shown

### Submit Solution
1. Select a question
2. Write C++ code in the editor
3. Click "Submit" button
4. View results instantly

### Results Display
- **ACCEPTED** - All test cases passed ✅
- **WRONG ANSWER** - Output doesn't match ❌
- **COMPILATION ERROR** - Code won't compile ⚠️
- **TIME LIMIT EXCEEDED** - Execution took too long ⏱️
- **PENDING** - Still processing 🔄

## 🚀 Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

Preview production build:
```bash
npm run preview
```

## 🔗 API Integration

The app communicates with the backend API at `http://localhost:5000/api`.

### API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/user/questions` | Fetch all questions |
| GET | `/user/questions/:id` | Get question details |
| POST | `/user/submission` | Submit code |
| GET | `/user/submission/history` | View history |
| GET | `/user/auth` | User OAuth flow |
| GET | `/admin/auth` | Admin OAuth flow |

Token is automatically added to all authenticated requests.

## 🎨 Theming

The app uses CSS variables for theming. Edit `src/styles/global.css` to customize colors:

```css
:root {
  --primary: #3b82f6;
  --secondary: #10b981;
  --danger: #ef4444;
  /* ... more colors */
}
```

## ⚡ Performance

- Lazy loading components
- Code splitting with Vite
- Optimized rendering with React hooks
- Minimal dependencies

## 🤝 Development

### Add New Components

Create new components in `src/components/` and import them in `App.jsx`.

### API Calls

Use the exported functions from `src/services/api.js`:

```javascript
import { questionsAPI } from './services/api';

const questions = await questionsAPI.getAllQuestions();
```

### State Management

Use React Context API for global state (auth, user data).

## 🐛 Troubleshooting

### CORS Issues
Make sure the backend is running on `http://localhost:5000` and CORS is enabled.

### Token Not Persisting
Check browser localStorage settings. Ensure cookies/storage are not blocked.

### OAuth Redirect Not Working
Verify Google OAuth credentials are correct in the backend `.env` file.

## 📝 Notes

- The app stores JWT tokens in localStorage
- Clear localStorage in DevTools to reset authentication
- For security, never commit `.env` files or tokens

## 🚀 Next Steps

- Add user submission history page
- Admin panel for creating questions
- Code syntax highlighting with Prism.js or Monaco editor
- Dark mode toggle
- Search and filter questions
