# FairPass AI — Anti-Scalping & Smart Ticketing Platform

An intelligent, full-stack ticketing platform powered by Machine Learning and pessimistic database locking to detect and mitigate scalper bot behavior during high-demand ticket releases.

---

## 🌟 Key Features

* **Machine Learning Anti-Scalping Engine:** Real-time behavioral risk scoring (0.0 to 1.0) using a trained Random Forest classifier assessing dwell times, click intervals, and retry patterns.
* **Concurrency Protection:** PostgreSQL pessimistic locking (`SELECT ... FOR UPDATE`) preventing race conditions, inventory overselling, and bulk automated drains.
* **Role-Based Access Control:** Strict role segregation between standard ticket buyers (`USER`) and event organizers / security auditors (`ADMIN`).
* **Route Guards & Session Security:** Route protection redirecting unauthenticated users to a dedicated sign-in portal with zero demo pre-fills.
* **Admin Command Center & Telemetry:** Live risk tier breakdown, recent database behavior logs (`behavior_logs`), benchmark simulation suite, and event publishing.
* **Modern UI/UX:** Responsive, dark-themed glassmorphism interface built with React 19, Vite, and Lucide icons.

---

## 🏗️ Project Architecture

```
FairPassAI/
├── smart-ticketing-backend/
│   └── smart-ticketing-backend/
│       ├── app/
│       │   ├── models/         # SQLAlchemy models (User, Event, TicketTier, Booking, etc.)
│       │   ├── routes/         # Blueprints: auth, events, tickets, admin
│       │   ├── services/       # ML inference, risk classification & telemetry
│       │   ├── config.py       # Configuration & PostgreSQL connection URI
│       │   └── extensions.py   # SQLAlchemy, JWT, CORS
│       ├── scripts/            # Synthetic data generation & model training
│       ├── requirements.txt    # Python dependencies
│       └── run.py              # Flask server entrypoint
│
└── smart-ticketing-frontend/
    ├── src/
    │   ├── components/         # React UI: EventCatalog, TelemetryLab, AdminDashboard, etc.
    │   ├── api.js              # REST API client with JWT interception & 401 clearing
    │   ├── App.jsx             # React Router structure with ProtectedRoute guards
    │   └── App.css             # Glassmorphism styling & design tokens
    ├── package.json            # Node.js dependencies
    └── vite.config.js          # Vite configuration with API proxying
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js:** v18+
* **Python:** v3.10+
* **PostgreSQL:** Running locally on port `5432` with database `ticketing_db`

---

### 2. Backend Setup

```bash
cd smart-ticketing-backend/smart-ticketing-backend

# Activate virtual environment
# Windows:
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the Flask API server (starts on http://127.0.0.1:5000)
python run.py
```

---

### 3. Frontend Setup

```bash
cd smart-ticketing-frontend

# Install dependencies
npm install

# Start Vite dev server (starts on http://localhost:3000)
npm run dev
```

---

## 🔑 Demo Accounts

| Account Type | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Regular User** | `vignesh@example.com` | `password123` | `USER` |
| **Administrator** | `admin@fairpass.io` | `admin123` | `ADMIN` |

---

## 🛡️ License & Author
Created by **MJ-Vignesh-07** ([vigneshmj07@gmail.com](mailto:vigneshmj07@gmail.com)).
