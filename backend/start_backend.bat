@echo off
title Guestbooks Hotel Management - Python AI OCR Backend
echo ===================================================
echo   Starting Guestbooks AI OCR Backend (Port 8008)
echo ===================================================
cd /d "%~dp0"

if not exist venv (
    echo Creating virtual environment (venv)...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing/Checking Python dependencies...
pip install -r requirements.txt

echo.
echo ===================================================
echo   Guestbooks Backend Server live at http://localhost:8008
echo ===================================================
python -m uvicorn app.main:app --host 0.0.0.0 --port 8008 --reload
pause
