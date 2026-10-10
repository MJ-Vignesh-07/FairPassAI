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

## ☁️ Deploying to Render

FairPass AI is pre-configured with a **Render Blueprint (`render.yaml`)** to provision PostgreSQL, the Flask backend web service, and the React static site with a single click.

### Method 1: 1-Click Blueprint Deployment (Recommended)

1. Push your repository to GitHub (or use your existing fork/repo).
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository: `MJ-Vignesh-07/FairPassAI`.
5. Render will automatically detect [`render.yaml`](file:///c:/Users/M.J.Vignesh/OneDrive/Desktop/S5%20Mini-Project/render.yaml) and display the three provisioned resources:
   - **`fairpass-db`** (Managed PostgreSQL Database)
   - **`fairpass-backend`** (Python Flask Web Service with Gunicorn & ML Engine)
   - **`fairpass-frontend`** (Vite + React Static Site with SPA Rewrites)
6. Click **Apply**.
7. Render will build and deploy the entire stack:
   - Tables and initial demo seed data (`vignesh@example.com`, `admin@fairpass.io`, sample events) will be automatically created on startup via `init_db.py`.
   - Your frontend static site will be assigned a public URL (e.g. `https://fairpass-frontend.onrender.com`).

---

### Method 2: Manual Render Dashboard Setup

If you prefer to configure services manually in the Render UI:

#### Step 1: Create PostgreSQL Database
1. Click **New +** → **PostgreSQL**.
2. **Name:** `fairpass-db`
3. **Database:** `ticketing_db`
4. **User:** `fairpass_user`
5. **Plan:** Free
6. Click **Create Database**.
7. Once created, copy the **Internal Database URL** (e.g., `postgres://fairpass_user:...@dpg-...:5432/ticketing_db`).

#### Step 2: Create Backend Web Service
1. Click **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Configure settings:
   - **Name:** `fairpass-backend`
   - **Language:** `Python 3`
   - **Root Directory:** `smart-ticketing-backend/smart-ticketing-backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python init_db.py && gunicorn run:app`
   - **Plan:** Free
4. Add **Environment Variables**:
   - `DATABASE_URL`: *(Paste the Internal Database URL from Step 1)*
   - `SECRET_KEY`: *(Enter a secure random string)*
   - `JWT_SECRET_KEY`: *(Enter a secure random string)*
   - `PYTHON_VERSION`: `3.11.9`
5. Click **Create Web Service**. Wait for the build to finish and copy your backend URL (e.g., `https://fairpass-backend.onrender.com`).

#### Step 3: Create Frontend Static Site
1. Click **New +** → **Static Site**.
2. Connect the same repository.
3. Configure settings:
   - **Name:** `fairpass-frontend`
   - **Root Directory:** `smart-ticketing-frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Add **Environment Variable**:
   - `VITE_API_URL`: `https://fairpass-backend.onrender.com` *(Paste your Step 2 backend URL)*
5. Configure **Redirects / Rewrites**:
   - Under the **Redirects/Rewrites** tab, add a rule:
     - **Type:** `Rewrite`
     - **Source:** `/*`
     - **Destination:** `/index.html`
6. Click **Create Static Site**.

---

### ⏱️ Render Free Tier Notes
* **Cold Starts:** Free Render Web Services spin down after 15 minutes of inactivity. When a new request arrives, it takes ~30–50 seconds for the backend to wake up.
* **Database Expiration:** Free PostgreSQL databases on Render expire after 90 days. For persistent production use, upgrade the database tier or attach external databases (Supabase, Neon, AWS RDS) by pasting the connection string into `DATABASE_URL`.

---

## 🛡️ License & Author
Created by **MJ-Vignesh-07** ([vigneshmj07@gmail.com](mailto:vigneshmj07@gmail.com)).

