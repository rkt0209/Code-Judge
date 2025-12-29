# ⚖️ Code Judge — Remote Code Execution Backend

A secure backend engine for an Online Judge system built using **Node.js**, **Redis**, and **C++**.  
It compiles user code safely, runs it against test cases, and returns accurate verdicts.

---

## 🚀 Features

- Secure execution of user C++ programs
- Task queue using **Redis + Bull**
- Google OAuth 2.0 authentication
- JWT-based authorization
- Local file storage for solutions and I/O files
- Verdict system:
  - ACCEPTED
  - WRONG ANSWER
  - COMPILATION ERROR
  - TIME LIMIT EXCEEDED

---

## 🛠️ Tech Stack

- Node.js (Express)
- MongoDB (Mongoose)
- Redis + Bull
- G++ Compiler
- Google OAuth + JWT
- Multer & FS

---

## ⚙️ Prerequisites

Make sure these are installed on your machine:

- Node.js (v18+)
- MongoDB
- Redis
- G++ Compiler

Check Redis:

```
redis-cli ping
```

---

# 🔽 1️⃣ Clone the Repository

### Command

```
git clone https://github.com/rohit070805/Code-Judge-Rohit.git
```
### Go inside the project:
```
cd Code-Judge-Rohit
```


---

# 📦 2️⃣ Install Dependencies

### Command
```
npm install



---

# 🔐 3️⃣ Create `.env` File

Create a `.env` file inside the root directory.

### Content to paste:
```
Server
PORT=5000
NODE_ENV=development

MongoDB
MONGO_URL=mongodb://127.0.0.1:27017/code-judge

Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d

Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

USER_REDIRECT_URI=http://localhost:5000/api/user/auth/redirect
ADMIN_REDIRECT_URI=http://localhost:5000/api/admin/auth/redirect
```


---

# 📁 4️⃣ Create Required Folders

### Command
```
mkdir uploads
mkdir processing
```


---

# ▶️ 5️⃣ Run Services

You need **two terminals**

---

### 🟩 Terminal 1 — Start Backend Server
```
npm run dev
```


---

### 🟦 Terminal 2 — Start Worker (Judge Engine)
```
node worker.js
```


---

# 🧪 6️⃣ Testing the System

### Run test script:
```
node test-system.js
```
This will:

- connect to MongoDB  
- create a test problem  
- submit C++ code  
- push job to Redis  
- compile & execute  
- return verdict (e.g. ACCEPTED)

---

## 📌 Notes

- MongoDB and Redis must be running
- Do not upload `.env` to GitHub

---

## 🚀 Future Plans

- Docker support  
- Multi-language support  
- Admin dashboard UI  

---

## 🤝 Contributing

Pull requests are welcome.  
If you like this project, please ⭐ the repo!