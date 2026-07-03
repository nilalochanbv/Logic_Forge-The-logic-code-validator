# LogicForge 🛠️

An AI-powered logic building sandbox designed to help beginner programmers cultivate algorithmic reasoning, sequence coordination, and problem-solving structures **before** learning programming language syntax.

---

## 🚫 Platform Rules
1. **NO CODE GENERATION**: The AI evaluator will never give code solutions.
2. **NO SYNTAX RUNTIME**: There are no compilers, interpreters, or code executables.
3. **NO CODE SUGGESTIONS**: The editor accepts only plain English logic steps.

---

## 🚀 Quick Start Instructions

Follow these quick commands to spin up the local development suite:

### 1. Installation
In the project root workspace directory, install both client and server packages:
```bash
npm run install:all
```

### 2. Configure Environment Variables
Inside the `/backend` folder, copy or update the `.env` configuration:
```env
PORT=5000
MONGODB_URI=your-mongodb-connection-string
OPENAI_API_KEY=your-openai-api-key
JWT_SECRET=any-random-string-token
```
> [!NOTE]
> **NO MONGO? NO OPENAI KEY? NO PROBLEM!**  
> If `MONGODB_URI` is left blank, the server automatically boots into **Local Database Fallback** using a JSON file state manager.  
> If `OPENAI_API_KEY` is left blank, the AI Evaluator and AI Mentor boot into **Heuristic Fallback**, which evaluates logical steps for the 9 core questions using smart sequential checkers and keyword matching.

### 3. Launch Development Server
In the root directory, run:
```bash
npm run dev
```
This spins up the Express server on port `5000` and the Vite client on port `5173` concurrently.

---

## 🌌 Tech Stack
- **Frontend**: Vite, React, Tailwind CSS (v3), Framer Motion, Recharts, Lucide Icons.
- **Backend**: Node.js, Express.js, Mongoose.
- **Database**: MongoDB (with automated JSON Fallback).
- **AI Suite**: OpenAI Node SDK.
