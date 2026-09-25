@echo off
title Python PaddleOCR Backend Server (Port 8000)
cd /d "%~dp0backend"
echo Starting Python PaddleOCR FastAPI server on http://localhost:8000 ...
call start_backend.bat
