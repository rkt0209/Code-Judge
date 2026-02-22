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
git clone https://github.com/rkt0209/Code-Judge.git
```
### Go inside the project:
```
cd Code-Judge
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

-You can use docker directly ,then directly jump to Testing Step 0
```
docker compose up --build
```
- if you are not using docker then You need **two terminals**

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

## Step 0: Get Authentication Tokens
# To perform actions, you need a JWT Token. Since we use Google OAuth, follow these steps:
# For User Token:

- Open your browser and visit: http://localhost:5000/api/user/auth
- Sign in with your Google account.

- The browser will show a JSON response. Copy the token string.

# For Admin Token:
- Open your browser and visit: http://localhost:5000/api/admin/auth
- Sign in with your Google account.
- The browser will show a JSON response. Copy the token string.

# Step 1: Admin - Upload a Question

- Endpoint: POST /api/admin/questions/create

- Auth: Select "Bearer Token" and paste your Admin Token.

- Body (form-data):
```
title: "Sum of Two Numbers"

content: "Read two integers and print their sum."

tags: "math,easy"

input_file: [Select a text file containing 10 20]

solution_file: [Select a text file containing 30]
```
- Response: Copies the _id of the created question.

# Step 2: User - View All Available Questions

- Endpoint: GET /api/user/questions

- Auth: **No authentication required**

- Response Example:
```json
{
  "message": "Questions Fetched Successfully",
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Sum of Two Numbers",
      "content": "Read two integers and print their sum.",
      "time_limit": 2,
      "difficulty": "easy",
      "createdAt": "2026-02-22T10:00:00.000Z"
    }
  ]
}
```

---

# Step 3: User - View a Specific Question

- Endpoint: GET /api/user/questions/:question_id

- Auth: **No authentication required**

- Response: Returns the question with full description.

---

# Step 4: User - Submit a Solution

- Endpoint: POST /api/user/submission

- Auth: Select "Bearer Token" and paste your User Token.

- Body (form-data):
```
question_id: [Paste the ID from Step 1]

submission_file: [Select your C++ file]
```
- Result: The server will return ACCEPTED if your code matches the solution.


# Step 5: User - View Submission History
```
Endpoint: GET /api/user/submission/history

Auth: Bearer Token (User Token)
```
# ⚡ Advanced: Experiencing the Redis Queue
```
You are asking a very sharp question about the system architecture.
Currently, you are seeing ACCEPTED in Postman because your code is running in Synchronous Mode (Blocking). The API server is politely waiting for the Worker to finish before replying to you.
To see the "Queued" message and the PENDING status, we must switch the API to Asynchronous Mode (Non-Blocking).
Here is exactly what happens in both scenarios:
Scenario 1: Current Setup (Synchronous / Blocking)
•	Behavior: The API adds the job to the queue and pauses (await job.finished()). It waits until the Worker says "I'm done!"
•	Postman Response: You wait 1-2 seconds, then get the final result:
JSON
{ "status": "ACCEPTED", "execution_time": 0.05 }
•	Why use this? Good for simple sites where users want immediate feedback.
Scenario 2: Heavy Load Setup (Asynchronous / Non-Blocking)
•	Behavior: The API adds the job to the queue and replies immediately. It does NOT wait for the worker.
•	Postman Response: You get an instant response (in milliseconds):
JSON
{
    "message": "Submission Queued! We are processing it in the background.",
    "status": "PENDING"
}
•	What happens to the Verdict? Since the worker hasn't finished yet, the status in the database is set to PENDING.
•	How does the user see "ACCEPTED"? The user must check the History API (GET /history) a few seconds later. By then, the worker will have finished and updated the database from PENDING → ACCEPTED.
________________________________________
How to see the "Queued" & "PENDING" status right now
To experience this, you need to swap the code in controllers/user/submission.js.
1.	Open controllers/user/submission.js 2. Comment out the "Blocking" logic and Uncomment the "Non-Blocking" logic.
2.	Now Uncomment the async function submitFile (there are two functions with same name),uncomment the one here working of redis queue is written
3.	Now on submission the api will reply immediately without waiting the submission is queued.
4.	After on worker terminal the output will displaced a  bit late based on the queue size.
5.	After output display when you will check the submission history then it will show the actual result of compilation.
6.	If you use the another function commenting this one the api will wait until execution I done, and as the output is displaced on worker terminal the response will be send on postman.
The Experiment
1.	Restart Server: npm run dev.
2.	Restart Worker: node worker.js.
3.	Postman: Send a submission.
4.	Result:
o	Postman immediately returns: "status": "PENDING".
o	Terminal 2 (Worker) wakes up a moment later: Job Received... Compiled... Verdict: ACCEPTED.
o	Postman History: If you check GET /history now, that same submission will now say "status": "ACCEPTED".



```
## 🛡️ Advanced: Experiencing the Sandbox (Security)

The "Sandbox" prevents user code from crashing the server. To test this, try submitting these malicious/broken codes:

### **1. The Infinite Loop (Availability Attack)**
Submit this code to see how the system kills the process after the time limit.
```cpp
#include <iostream>
using namespace std;
int main() {
    while(true) { 
        // This runs forever
    }
    return 0;
}
```
- Observation: The Worker logs ⚠️ Process killed due to timeout! and the verdict is TIME LIMIT EXCEEDED.
## 📌 Notes

- MongoDB and Redis must be running
- Do not upload `.env` to GitHub

---
## 🐳 Docker Setup (Optional)
Instead of running services manually, you can spin up the entire ecosystem (Mongo, Redis, API, Worker) with one command.

1.  **Install Docker Desktop.**
2.  **Run:**
    ```bash
    docker-compose up --build
    ```
3.  **Access:** The API is now running at `http://localhost:5000`.
    * *Note: Code execution happens inside the Linux container, ensuring a consistent environment.*
    
## 🚀 Future Plans

 
- Multi-language support  
- Admin dashboard UI  

---

## 🤝 Contributing

Pull requests are welcome.  
If you like this project, please ⭐ the repo!
