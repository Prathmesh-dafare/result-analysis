# ✦ InsightGrade AI
### Smart Result Analysis & Performance Intelligence Platform

A full-stack, AI-powered academic analytics platform built with pure HTML/CSS/JS + Node.js + MongoDB + Gemini AI.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <your-repo>
cd insightgrade
npm install
```

### 2. Configure Environment
```bash
cp server/.env.example server/.env
# Edit server/.env with your actual keys
```

### 3. Set Your Keys in `server/.env`
| Key | Where to get |
|-----|-------------|
| `MONGO_URI` | [MongoDB Atlas](https://cloud.mongodb.com) → Free Tier → Connect |
| `JWT_SECRET` | Any random 32+ char string |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) → Free |
| `EMAILJS_*` | [EmailJS.com](https://emailjs.com) → Free plan (optional) |

### 4. Run
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Open `http://localhost:5000`

---

## 📁 Project Structure

```
insightgrade/
├── package.json
├── server/
│   ├── server.js              # Express entry point
│   ├── .env.example           # Environment template
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── models/
│   │   ├── User.js            # User schema (student/teacher/admin)
│   │   └── Result.js          # Results + subjects schema
│   ├── controllers/
│   │   ├── authController.js  # Register, login, forgot/reset password
│   │   ├── resultController.js # CRUD, CSV/Excel upload, analytics
│   │   └── aiController.js    # Gemini: mentor, roadmap, story, resume
│   ├── routes/
│   │   ├── auth.js
│   │   ├── results.js
│   │   ├── ai.js
│   │   ├── users.js
│   │   └── notifications.js
│   └── middleware/
│       └── auth.js            # JWT protect + role authorize
│
└── client/
    ├── index.html             # Landing page
    ├── login.html
    ├── register.html
    ├── dashboard.html         # Main hub
    ├── analytics.html         # Results + upload
    ├── mentor.html            # AI chat + roadmap + resume
    ├── reports.html           # PDF export
    ├── profile.html           # Settings + theme
    ├── forgot-password.html
    ├── reset-password.html
    ├── css/
    │   ├── style.css          # Global + themes + components
    │   ├── dashboard.css      # Sidebar, charts, galaxy, chat
    │   └── mobile.css         # Bottom nav, responsive breakpoints
    └── js/
        ├── api.js             # All API calls with JWT
        ├── utils.js           # Toast, theme, auth helpers, formatters
        ├── auth.js            # Login/register/forgot/reset handlers
        ├── dashboard.js       # KPIs, charts, galaxy, heatmap, timeline
        ├── analytics.js       # Results list, upload, manual entry, search
        └── mentor.js          # Chat, roadmap, resume AI features
```

---

## 🎨 Features

| Feature | Status |
|---------|--------|
| JWT Auth (Student / Teacher / Admin) | ✅ |
| Dark Neon + 4 other themes | ✅ |
| Performance Galaxy (Canvas 3D) | ✅ |
| SGPA/Subject Chart.js charts | ✅ |
| Academic Health Ring | ✅ |
| Activity Heatmap | ✅ |
| AI Academic Mentor (Gemini) | ✅ |
| AI Study Roadmap Generator | ✅ |
| AI Academic Story | ✅ |
| AI Resume Achievement Builder | ✅ |
| AI Per-Result Insight | ✅ |
| CSV / Excel File Upload | ✅ |
| Manual Result Entry | ✅ |
| Performance Prediction (Linear Reg) | ✅ |
| PDF Report Export (jsPDF) | ✅ |
| Notification System | ✅ |
| Smart Search (teacher/admin) | ✅ |
| Mobile-first + Bottom Nav | ✅ |
| Skeleton loaders + Toast system | ✅ |
| Forgot/Reset Password + EmailJS | ✅ |

---

## 📤 CSV Upload Format

```csv
rollNumber,semester,year,sub_Mathematics,cred_Mathematics,sub_Physics,cred_Physics
21CS001,3,2024,78,4,65,3
21CS002,3,2024,85,4,72,3
```

Rules:
- Subject marks: `sub_SubjectName`
- Subject credits: `cred_SubjectName`
- `rollNumber` must match a registered student

---

## 🌐 Deployment (Render / Railway / Cyclic)

1. Push to GitHub
2. Connect repo to Render (Free tier)
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all env variables in dashboard
6. Done ✓

---

## 🛠 Tech Stack

**Frontend:** HTML5, CSS3, Vanilla JS (ES6+), Chart.js, jsPDF  
**Backend:** Node.js, Express.js  
**Database:** MongoDB Atlas (Free)  
**Auth:** JWT + bcryptjs  
**AI:** Google Gemini 1.5 Flash (Free)  
**Email:** EmailJS (Free)  
**File Parsing:** SheetJS (xlsx)  

---

## 🎓 Demo Accounts

After seeding (or register manually):
- **Student:** `demo.student@insightgrade.ai` / `Demo@1234`
- **Teacher:** `demo.teacher@insightgrade.ai` / `Demo@1234`

---

## 📝 License

MIT — Free for personal, academic, and portfolio use.
