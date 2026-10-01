@echo off
title Guestbooks PMS - All In One Launcher
echo ========================================================
echo   Starting Guestbooks PMS & Python OCR Backend
echo ========================================================
echo.

echo [1/2] Starting Python AI OCR Backend (Port 8008)...
start "Guestbooks - Python OCR Backend (Port 8008)" cmd /k "cd /d %~dp0backend && .\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8008"

timeout /t 2 /nobreak >nul

echo [2/2] Starting React Vite Frontend (Port 5173)...
start "Guestbooks - Vite Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo   Servers launched successfully!
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:8008
echo ========================================================
timeout /t 5 >nul
