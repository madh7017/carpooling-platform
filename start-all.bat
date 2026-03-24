@echo off
REM Start everything - Backend + Frontend (Windows)
REM Usage: start-all.bat

setlocal enabledelayedexpansion

echo 🚀 Starting CarPool Platform...
echo.

REM Check if MongoDB is running
echo 📦 Starting backend server...
cd server
echo Checking MongoDB connection...

REM Start backend in new window
start "CarPool Backend" cmd /k "npm run dev"
echo ✓ Backend started in new window
timeout /t 3 /nobreak

REM Start frontend in new window
echo 📦 Starting frontend server...
cd ..\client
start "CarPool Frontend" cmd /k "npm run dev"
echo ✓ Frontend started in new window

echo.
echo ✅ Both services starting!
echo.
echo 📍 URLs:
echo    Backend:  http://localhost:5000
echo    Frontend: http://localhost:5173
echo.
echo ⚠️  Close the command windows to stop the services
echo.
pause
