# Job Openings Portal

This project has been restructured into two dedicated directories:
- **`client/`**: React frontend built with Vite
- **`server/`**: Node.js backend API and MongoDB database handlers

---

## Directory Structure

```text
job openings portal/
├── client/                  # Frontend (React + Vite)
│   ├── public/              # Static assets & icons
│   ├── src/                 # React components, pages, context, and styles
│   ├── index.html           # HTML entry point
│   ├── vite.config.js       # Vite configuration & API proxy (/api -> localhost:3000)
│   └── package.json         # Frontend dependencies & scripts
│
├── server/                  # Backend & Database (Node.js)
│   ├── api/                 # API endpoint route handlers (auth, jobs, resumes, etc.)
│   ├── lib/                 # Database connection (db.js) & CORS helpers
│   ├── server.js            # Node HTTP server routing requests to handlers
│   ├── .env                 # Environment variables (MONGODB_URI, JWT_SECRET, SMTP)
│   └── package.json         # Backend dependencies & scripts
│
├── package.json             # Root helper scripts
└── README.md                # Project documentation
```

---

## Quick Start Guide

### 1. Install Dependencies

You can install both client and server dependencies with a single command from the project root:

```bash
npm run install:all
```

Or install them individually:
```bash
# In client folder:
cd client
npm install

# In server folder:
cd ../server
npm install
```

---

### 2. Configure Environment Variables

Ensure `server/.env` contains your database and secret credentials:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Diverse Solutions" <your_email@gmail.com>
```

---

### 3. Run the Project

Run both the server and client in separate terminals:

#### Terminal 1: Backend Server
From the root directory:
```bash
npm run server
```
*(Or navigate to `cd server` and run `npm start` or `npm run dev`)*
- Runs at: `http://localhost:3000`

#### Terminal 2: Frontend Client
From the root directory:
```bash
npm run client
```
*(Or navigate to `cd client` and run `npm run dev`)*
- Runs at: `http://localhost:5173`

---

## Available NPM Scripts

### Root Level
- `npm run client`: Starts the Vite dev server for `client/`
- `npm run server`: Starts the backend server for `server/`
- `npm run build`: Builds the production bundle in `client/`
- `npm run install:all`: Installs dependencies in both `client` and `server`

### Inside `client/`
- `npm run dev`: Starts Vite local dev server (`http://localhost:5173`)
- `npm run build`: Builds production React bundle to `client/dist`
- `npm run preview`: Previews production build locally
- `npm run lint`: Runs oxlint

### Inside `server/`
- `npm start`: Starts Node.js backend server (`http://localhost:3000`)
- `npm run dev`: Starts Node.js backend with watch mode (`node --watch server.js`)
