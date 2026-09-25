@echo off
title Python PaddleOCR Backend Server
echo ===================================================
echo   Starting Python PaddleOCR Backend (Port 8000)
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
echo   FastAPI Server live at http://localhost:8000
echo ===================================================
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
