# CitiConnect — Smart Urban Solutions & Community Portal
### Full-Stack Deployment Guide · Addis Ababa, Ethiopia

---

## Stack Overview

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js 20 + Express |
| Database | Firebase Firestore (NoSQL, realtime) |
| Auth | Firebase Authentication (MFA-ready) |
| Email | SendGrid |
| SMS | Twilio |
| Maps | Leaflet + OpenStreetMap |
| Hosting | Vercel (frontend) + Railway or Render (backend) |
| CI/CD | GitHub Actions |

---

## Project Structure

```
citiconnect/
├── backend/
│   ├── server.js              # Express entry point
│   ├── config/
│   │   └── firebase.js        # Firebase Admin SDK init
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   ├── rateLimit.js       # Rate limiting + brute-force protection
│   │   └── security.js        # Helmet, CORS, sanitization
│   ├── routes/
│   │   ├── issues.js          # CRUD for city issues
│   │   ├── community.js       # Help board posts
│   │   ├── chat.js            # Chat rooms (Socket.io)
│   │   └── admin.js           # Admin alerts + audit log
│   └── services/
│       ├── emailService.js    # SendGrid email notifications
│       ├── smsService.js      # Twilio SMS alerts
│       └── securityService.js # Threat detection + logging
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   ├── firebase.js    # Firestore client
│   │   │   ├── api.js         # Backend API calls
│   │   │   └── socket.js      # Socket.io client
│   │   ├── pages/
│   │   │   ├── MapPage.jsx
│   │   │   ├── CommunityPage.jsx
│   │   │   ├── AnalyticsPage.jsx
│   │   │   └── TransportPage.jsx
│   │   └── components/
│   │       ├── Topbar.jsx
│   │       ├── Sidebar.jsx
│   │       ├── IssueCard.jsx
│   │       ├── ChatPanel.jsx
│   │       └── NotifPanel.jsx
├── .github/workflows/
│   └── deploy.yml             # CI/CD pipeline
└── README.md
```

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/your-org/citiconnect.git
cd citiconnect

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Set environment variables

Copy `.env.example` to `.env` in both `backend/` and `frontend/` and fill in your keys (see below).

### 3. Run locally

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Frontend → http://localhost:5173  
Backend API → http://localhost:4000

---

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for all required keys.
