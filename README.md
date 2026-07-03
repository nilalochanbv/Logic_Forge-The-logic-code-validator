# LogicForge 🛠️

An AI-powered logic building sandbox designed to help beginner programmers cultivate algorithmic reasoning, sequence coordination, and problem-solving structures **before** learning programming language syntax.

---

## 🚫 Platform Rules
1. **NO CODE GENERATION**: The AI evaluator will never give code solutions.
2. **NO SYNTAX RUNTIME**: There are no compilers, interpreters, or code executables.
3. **NO CODE SUGGESTIONS**: The editor accepts only plain English logic steps.

---

## 🚀 Local Development Guide

Follow these quick commands to spin up the local development suite:

### 1. Configure Backend Environment
Inside the `backend/.env` file, configure your settings:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/logicforge
JWT_SECRET=logicforge_secret_key_1337
GEMINI_API_KEY=your-gemini-api-key
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 2. Configure Frontend Environment
Inside the `frontend/.env` file, configure your settings:
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 3. Start Development Server
In the root directory, run:
```bash
npm run dev
```
This command runs both servers concurrently:
*   **Vite Frontend**: Starts on `http://localhost:5174` (configured in `vite.config.js` to match Google Console Authorized Origins).
*   **Java Spring Boot Backend**: Starts on `http://localhost:5000` (executed via the NetBeans Maven helper batch script `run_backend.cmd`).

---

## 🌌 Tech Stack
*   **Frontend**: React, Vite (port 5174), Tailwind CSS, Framer Motion, Lucide Icons.
*   **Backend**: Java 17+, Spring Boot (port 5000), Maven.
*   **Database**: MongoDB (with local JSON fallback `db_fallback.json` if MongoDB is unreachable).
*   **AI Suite**: Google Gemini API (`GEMINI_API_KEY`) used for evaluating logic and guiding chat queries.
*   **Auth**: Google Identity Services OAuth (Client ID).

---

## ☁️ Deployment Guide (Render)
To deploy this project to Render:
1. Create a new **Web Service** on Render and connect your GitHub repository.
2. Choose **Docker** as the Language runtime.
3. Keep the **Branch** as `main`.
4. In the **Advanced Settings**:
   *   **Root Directory**: Keep it blank (Render will build from the root using the root-level `Dockerfile` which references the `backend` folder).
   *   Add the following **Environment Variables**:
       *   `PORT` = `5000`
       *   `GEMINI_API_KEY` = `your-gemini-api-key`
       *   `JWT_SECRET` = `your-jwt-secret-string`
       *   `MONGODB_URI` = `your-production-mongodb-connection-string` (Atlas recommended)
