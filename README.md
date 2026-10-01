# Guestbooks Hotel PMS & AI Document OCR System

Production-ready Full-Stack Property Management System (PMS) and AI Document Scanner for Hotels, Lodges, and Guest Houses.

---

## 🏗️ Architecture & Folder Structure

```
hotel/
├── backend/                  # Python FastAPI AI OCR & SQLite Database Service
│   ├── app/
│   │   ├── api/              # API Route handlers (OCR, Guest Check-In/Check-Out)
│   │   ├── db/               # SQLite Sequential Database Manager
│   │   ├── services/         # OpenCV / EasyOCR / PyTesseract Indian ID Parser
│   │   └── main.py           # FastAPI Application Entrypoint
│   ├── data/                 # Persistent SQLite Database & Image Upload Volume
│   ├── Dockerfile            # Production Python Docker Container Definition
│   ├── requirements.txt      # Python Dependencies
│   └── start_backend.bat     # Windows Backend Launcher
│
├── frontend/                 # React SPA Frontend App (Vite + Tailwind CSS v4)
│   ├── public/               # Static assets & icons
│   ├── src/                  # React Components & Services
│   ├── Dockerfile            # Production Multi-Stage Nginx Container
│   ├── nginx.conf            # Nginx Reverse Proxy Config (/api proxying)
│   ├── package.json          # Node Dependencies & Scripts
│   └── vite.config.js        # Vite Config with Dev Proxy
│
├── docker-compose.yml        # Production Docker Orchestration Config
├── start_docker.bat          # 1-Click Docker Container Production Deployment
├── start_all.bat             # 1-Click Local Development Server Launcher
├── .env.example              # Environment Variable Template
└── README.md                 # System Documentation
```

---

## 🚀 Quick Start & Deployment

### Option A: Deploy with Docker (Recommended for Production & Cloud)

Ensure Docker Desktop / Docker Engine is installed and running.

```bash
# 1-Click Docker Build & Run
docker compose up --build -d
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8008](http://localhost:8008)
- **Database Storage**: Mounts `./backend/data` to `/app/data` inside container so all guest records, document photos, and signatures remain 100% persistent.

To stop the containers:
```bash
docker compose down
```

---

### Option B: Run Locally for Development

```bash
# Double-click start_all.bat or run:
./start_all.bat
```

Or run manually in two terminal tabs:

**Tab 1 (Backend):**
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Tab 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```

---

## ⚡ Key Features

1. **AI OCR Document Processing**:
   - Parses Aadhaar Cards, PAN Cards, Voter IDs, Passports, and Driving Licenses.
   - Cleans OCR noise, strips section delimiters, and normalizes address into Title Case.

2. **Sequential Database Archival**:
   - Generates sequential registration numbers (`REG-0001`, `REG-0002`, `REG-0003`...).
   - Stores Front Document Images, Back Document Images, and Digital Signatures in SQLite.

3. **Production Nginx Proxying**:
   - Zero CORS configuration required in production container — Nginx routes `/api/*` directly to `backend:8000`.
