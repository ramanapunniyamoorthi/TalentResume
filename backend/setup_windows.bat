@echo off
REM ====================================================================
REM TalentMatch AI - Windows Automated Setup Script
REM AI-Based Resume Screening and Job Role Matching Project
REM ====================================================================

echo ===================================================
echo [1/4] Checking Python Installation...
echo ===================================================
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not added to PATH!
    echo Please download and install Python 3.10+ from python.org and check "Add Python to PATH".
    pause
    exit /b 1
)
python --version

echo.
echo ===================================================
echo [2/4] Creating Virtual Environment (.venv)...
echo ===================================================
if not exist .venv (
    python -m venv .venv
    echo Virtual environment created.
) else (
    echo Virtual environment already exists.
)

echo.
echo ===================================================
echo [3/4] Activating Virtual Environment and Installing Dependencies...
echo ===================================================
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install pip requirements!
    pause
    exit /b 1
)

echo.
echo ===================================================
echo [4/4] Initializing SQLite Database and Running Tests...
echo ===================================================
python models.py
python -m unittest test_matcher.py

echo.
echo ===================================================
echo [SUCCESS] Setup Complete!
echo Starting Flask Backend Server at http://127.0.0.1:5000...
echo Press CTRL+C to stop server.
echo ===================================================
python app.py
pause
