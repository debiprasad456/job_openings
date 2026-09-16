# Job Openings Portal (Full-Stack Vercel App)

A modern full-stack job openings portal built for deployment on **Vercel** with a React (Vite) frontend, Node.js serverless functions, and MongoDB Atlas.

---

## Architecture

```text
job openings portal/
├── client/                     # Frontend Application (React + Vite)
│   ├── public/                 # Static assets, icons, logos
│   ├── src/                    # React components, pages, hooks, CSS
│   ├── index.html              # HTML entry point
│   ├── vite.config.js          # Vite config (proxies /api -> localhost:3000)
│   └── package.json            # Frontend-only dependencies
│
├── api/                        # Backend Serverless Functions (Vercel native)
│   ├── admin/                  # Admin application management
│   ├── applications/           # Application submission & tracking
│   ├── auth/                   # Register, login, OTP reset
│   ├── employer/               # Employer portal routes
│   ├── jobs/                   # Job listings & publishing
│   └── resumes/                # Resume download & preview
│
├── lib/                        # Shared Backend Utilities & Database
│   ├── db.js                   # MongoDB connection pool (cached client)
│   └── cors-helper.js          # CORS and response headers
│
├── server.js                   # Local Development HTTP Server (port 3000)
├── vercel.json                 # Vercel SPA routing and /api rewrites
├── package.json                # Root orchestration & serverless dependencies
└── .env                        # Local development environment variables
```

---

## Local Development

### 1. Install Dependencies
From the repository root:
```bash
npm install
```
*(NPM workspaces will automatically install both root backend dependencies and `client` frontend dependencies)*

### 2. Configure Local `.env`
Ensure `.env` exists in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Diverse Solutions" <your_email@gmail.com>
```

### 3. Run Locally

Open two terminals:

#### Terminal 1: Backend Server (Local Port 3000)
```bash
npm run server
```

#### Terminal 2: Frontend Client (Local Port 5173)
```bash
npm run client
```

Open `http://localhost:5173` in your browser. All API requests (`/api/*`) are proxied automatically to `http://localhost:3000`.

---

## Deploying to Vercel

1. **Root Directory Setting in Vercel**: Keep it as default `./` (the repository root).
2. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "deploy: configure native vercel full-stack app"
   git push origin main
   ```
3. **Set Environment Variables in Vercel Dashboard**:
   Go to **Project Settings &rarr; Environment Variables** and add:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`

Vercel will automatically build the client SPA and deploy all `/api` endpoints as serverless functions.
