# ⚖️ Coding Judge - Remote Code Execution Engine

A robust backend for an Online Judge system (like LeetCode or CodeForces) built with **Node.js**, **Redis**, and **C++**. This system creates a secure pipeline to compile and execute user-submitted code against test cases in real-time.

---

## 🚀 Features
* **Remote Code Execution:** Compiles and runs C++ code securely on the server.
* **Task Queueing System:** Uses **Redis** and **Bull** to handle high loads and process submissions asynchronously (prevents server blocking).
* **Google OAuth 2.0:** Secure user authentication and automated profile creation.
* **Verdict System:** Automatically judges submissions: `ACCEPTED`, `WRONG ANSWER`, `COMPILATION ERROR`, or `TIME LIMIT EXCEEDED`.
* **Local File Management:** Efficiently handles input/output/solution files using local disk storage.
* **Secure Validation:** Strict middleware for request validation and JWT-based authorization.

---

## 🛠️ Tech Stack
* **Runtime:** Node.js (Express.js)
* **Database:** MongoDB (Mongoose)
* **Message Queue:** Redis & Bull
* **Compiler:** G++ (GNU C++ Compiler)
* **Authentication:** Google OAuth 2.0 & JWT (JSON Web Tokens)
* **File Handling:** Multer & FS (FileSystem) module

---

## ⚙️ Prerequisites
Before running the project, ensure you have the following installed:
1.  **Node.js** (v18 or higher)
2.  **MongoDB** (Running locally or cloud URL)
3.  **Redis** (Must be running on port 6379 - check with `redis-cli ping`)
4.  **G++ Compiler** (MinGW for Windows or build-essential for Linux) - *Required for compiling C++ code.*

---

## 📦 Installation & Setup

### 1. Clone the Repository
```bash
git clone [https://github.com/YOUR_USERNAME/Coding-Judge-Rohit.git](https://github.com/YOUR_USERNAME/Coding-Judge-Rohit.git)
cd Coding-Judge-Rohit
npm install
. Install Dependencies
Bash

npm install
3. Setup Environment Variables
Create a .env file in the root directory and add the following configurations:

Code snippet

# Server Config
PORT=5000
NODE_ENV=development

# Database
MONGO_URL=mongodb://127.0.0.1:27017/coding-judge

# Redis Config (Ensure Redis is running)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# JWT Secret
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=30d

# Google OAuth (Get these from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
# These must match exactly what is in your Google Console
USER_REDIRECT_URI=http://localhost:5000/api/user/auth/redirect
ADMIN_REDIRECT_URI=http://localhost:5000/api/admin/auth/redirect
4. Create Required Folders
The system needs specific folders to store files during execution.

Bash

mkdir uploads
mkdir processing
5. Start the Services
You need two terminal windows running simultaneously.

Terminal 1: Start the Backend API

Bash

npm run dev
Terminal 2: Start the Worker (The Judge)

Bash

node worker.js
🧪 How to Use / Test
Since there is no frontend provided in this repo yet, you can test the functionality using the included test script.

Automated System Test
Run the system test to simulate a full submission flow:

Bash

node test-system.js
What this does:

Connects to MongoDB.

Creates a dummy question if it doesn't exist.

Uses your real Google OAuth Token (you must configure this in the script).

Submits C++ code (cin >> a >> b; cout << a + b;).

The API pushes the job to Redis.

The Worker compiles and runs it.

Returns the final verdict (should be ACCEPTED).