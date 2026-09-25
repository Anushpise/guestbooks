@echo off
title Guestbooks Hotel PMS - Docker Container Deployment
echo ========================================================
echo   Launching Hotel PMS & AI OCR Backend via Docker Compose
echo ========================================================
echo.

docker compose up --build -d

echo.
echo ========================================================
echo   Docker Containers Live & Running!
echo   - Frontend App: http://localhost:5173
echo   - Backend API:  http://localhost:8000
echo   - DB Storage:   ./backend/data/hotel_pms.db (Persistent)
echo ========================================================
pause
