#!/usr/bin/env bash
# Start everything - Backend + Frontend
# Usage: ./start-all.sh

set -e

echo "🚀 Starting CarPool Platform..."
echo ""

# Function to handle cleanup
cleanup() {
  echo ""
  echo "🛑 Shutting down services..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Navigate to server and start backend
echo "📦 Starting backend server..."
cd server

# Check if MongoDB is running
if ! npm run dev > /tmp/backend.log 2>&1 &
then
  echo "❌ Failed to start backend"
  echo "Check /tmp/backend.log for details"
  exit 1
fi
BACKEND_PID=$!
echo "  ✓ Backend PID: $BACKEND_PID"

# Give backend time to start
sleep 3

# Navigate to client and start frontend
echo "📦 Starting frontend server..."
cd ../client

if ! npm run dev > /tmp/frontend.log 2>&1 &
then
  echo "❌ Failed to start frontend"
  echo "Check /tmp/frontend.log for details"
  kill $BACKEND_PID
  exit 1
fi
FRONTEND_PID=$!
echo "  ✓ Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ Both services started!"
echo ""
echo "📍 URLs:"
echo "   Backend:  http://localhost:5000"
echo "   Frontend: http://localhost:5173"
echo ""
echo "📋 Logs:"
echo "   Backend:  tail -f /tmp/backend.log"
echo "   Frontend: tail -f /tmp/frontend.log"
echo ""
echo "Press Ctrl+C to stop both services..."
echo ""

# Wait for both processes
wait
