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

### Step 0: Install & Start Redis (CRITICAL)
This project **requires** Redis to manage the job queue. Without it, the worker cannot function.

* **For Windows:**
    1.  Download the **Windows Installer (.msi)** from [Memurai (Redis for Windows)](https://www.memurai.com/get-memurai) or use WSL.
    2.  Run the installer and finish the setup.
    3.  Open Task Manager > Services and ensure `Memurai` or `Redis` is **Running**.
* **For Mac/Linux:**
    ```bash
    # Mac
    brew install redis
    brew services start redis
    
    # Linux
    sudo apt install redis-server
    sudo service redis-server start
    ```
* **Verify it works:**
    Open a terminal and type:
    ```bash
    redis-cli ping
    # It must reply: PONG
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
```


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


-Since this is a backend-only project, use Postman to simulate the frontend.

# Step 0: Get Authentication Tokens
-To perform actions, you need a JWT Token. Since we use Google OAuth, follow these steps:
```
For User Token:

Open your browser and visit: http://localhost:5000/api/user/auth

Sign in with your Google account.

The browser will show a JSON response. Copy the token string.

For Admin Token:

Open your browser and visit: http://localhost:5000/api/admin/auth

Sign in with your Google account.

The browser will show a JSON response. Copy the token string.
```
# Step 1: Admin - Upload a Question
```
Endpoint: POST /api/admin/questions/create

Auth: Select "Bearer Token" and paste your Admin Token.

Body (form-data):

title: "Sum of Two Numbers"

content: "Read two integers and print their sum."

tags: "math,easy"

input_file: [Select a text file containing 10 20]

solution_file: [Select a text file containing 30]

Response: Copies the _id of the created question.
```
# Step 2: User - Submit a Solution
```
Endpoint: POST /api/user/submission

Auth: Select "Bearer Token" and paste your User Token.

Body (form-data):

question_id: [Paste the ID from Step 1]

submission_file: [Select your C++ file]

Result: The server will return ACCEPTED if your code matches the solution.
```
Step 0: Get Authentication Tokens
To perform actions, you need a JWT Token. Since we use Google OAuth, follow these steps:

User Token: Visit http://localhost:5000/api/user/auth -> Sign In -> Copy Token.

Admin Token: Visit http://localhost:5000/api/admin/auth -> Sign In -> Copy Token.

Step 1: Admin - Upload a Question
Endpoint: POST /api/admin/questions/create

Auth: Bearer Token (Admin Token)

Body (form-data):

title: "Sum of Two Numbers"

input_file: [Select file with 10 20]

solution_file: [Select file with 30]

Response: Copies the _id of the created question.

Step 2: User - Submit a Solution
Endpoint: POST /api/user/submission

Auth: Bearer Token (User Token)

Body (form-data):

question_id: [Paste ID from Step 1]

submission_file: [Select C++ file]

Result: Returns ACCEPTED / WRONG ANSWER.

# Step 3: User - View Submission History
```
Endpoint: GET /api/user/submission/history

Auth: Bearer Token (User Token)
```
# ⚡ Advanced: Experiencing the Redis Queue
```
By default, the API waits for the code to execute before responding (Synchronous). To demonstrate the power of the Non-Blocking Queue:

Modify Code: Open controllers/user/submission.js.

Uncomment the "Artificial Delay" block (sleep for 5s) inside the Worker i.e submissionqueue.process .

Uncomment the function submitFile as mentioned there

Run Test: Send lot of  submission via Postman.

Observation:

Postman: Returns "Submission Queued" instantly (milliseconds).

Terminal: Shows 🚧 WORKER: Starting Job... and waits 5 seconds before finishing.
```
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