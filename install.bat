@echo off
setlocal enabledelayedexpansion

echo.
echo ============================================
echo   CarPool Platform - Installation Script
echo ============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version

REM Get the script directory
set SCRIPT_DIR=%~dp0
set CLIENT_DIR=%SCRIPT_DIR%client
set SERVER_DIR=%SCRIPT_DIR%server

echo.
echo Project Root: %SCRIPT_DIR%
echo.

REM Install Client Dependencies
echo.
echo ============================================
echo   Installing Client Dependencies
echo ============================================
echo.
cd /d "%CLIENT_DIR%"
if exist "node_modules" (
    echo Client node_modules already exists, skipping...
) else (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install client dependencies
        pause
        exit /b 1
    )
)
echo.

REM Install Server Dependencies
echo.
echo ============================================
echo   Installing Server Dependencies
echo ============================================
echo.
cd /d "%SERVER_DIR%"
if exist "node_modules" (
    echo Server node_modules already exists, skipping...
) else (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install server dependencies
        pause
        exit /b 1
    )
)
echo.

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo.
    echo ============================================
    echo   Creating .env file
    echo ============================================
    echo.
    (
        echo MONGO_URI=mongodb://localhost:27017/carpooling
        echo JWT_SECRET=your_jwt_secret_key_here_change_in_production
        echo JWT_EXPIRE=7d
        echo PORT=5000
        echo NODE_ENV=development
    ) > .env
    echo .env file created successfully
    echo WARNING: Please update JWT_SECRET with a secure key
)

echo.
echo ============================================
echo   Installation Complete!
echo ============================================
echo.
echo Next Steps:
echo.
echo 1. Start MongoDB
echo    Make sure MongoDB is running on localhost:27017
echo.
echo 2. Start the Backend
echo    cd server ^&^& npm run dev
echo.
echo 3. Start the Frontend
echo    cd client ^&^& npm run dev
echo.
echo 4. Open in Browser
echo    http://localhost:5173
echo.
pause
