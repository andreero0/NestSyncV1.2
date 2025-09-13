#!/bin/bash

# NestSync Development Server Startup Script
# This script starts both the backend FastAPI server and frontend Expo server
# Usage: ./start-dev-servers.sh

set -e

echo "🇨🇦 Starting NestSync Development Environment..."
echo "=================================================="

# Function to kill background processes on exit
cleanup() {
    echo -e "\n🛑 Shutting down development servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo "✅ Backend server stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo "✅ Frontend server stopped"
    fi
    echo "👋 Development environment shut down"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Check if ports are available
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "❌ Port $port is already in use. Please stop the service using this port and try again."
        echo "   You can find the process with: lsof -i :$port"
        echo "   Kill it with: kill \$(lsof -t -i :$port)"
        exit 1
    else
        echo "✅ Port $port is available for $service"
    fi
}

# Check required ports
echo "🔍 Checking port availability..."
check_port 8001 "Backend (FastAPI)"
check_port 8082 "Frontend (Expo)"

# Start backend server
echo ""
echo "🚀 Starting FastAPI Backend Server (port 8001)..."
cd NestSync-backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run:"
    echo "   cd NestSync-backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment and start server
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!
echo "✅ Backend server started (PID: $BACKEND_PID)"

# Wait for backend to be ready
echo "⏳ Waiting for backend server to be ready..."
sleep 5

# Test backend connectivity
if curl -s http://localhost:8001/graphql -H "Content-Type: application/json" -d '{"query":"{ __schema { types { name } } }"}' | grep -q '"data"'; then
    echo "✅ Backend server is responding to GraphQL queries"
else
    echo "❌ Backend server is not responding correctly"
    exit 1
fi

# Start frontend server
echo ""
echo "🚀 Starting Expo Frontend Server (port 8082)..."
cd ../NestSync-frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ Node modules not found. Please run:"
    echo "   cd NestSync-frontend && npm install"
    exit 1
fi

npx expo start --port 8082 &
FRONTEND_PID=$!
echo "✅ Frontend server started (PID: $FRONTEND_PID)"

# Wait for frontend to be ready
echo "⏳ Waiting for frontend server to be ready..."
sleep 10

# Test frontend connectivity
if curl -s -I http://localhost:8082 | grep -q "HTTP/1.1 200 OK"; then
    echo "✅ Frontend server is responding"
else
    echo "❌ Frontend server is not responding correctly"
    exit 1
fi

echo ""
echo "🎉 Development environment is ready!"
echo "=================================================="
echo "🔹 Backend (GraphQL):  http://localhost:8001/graphql"
echo "🔹 Frontend (Web):     http://localhost:8082"
echo "🔹 Test Credentials:   andre_ero@yahoo.ca / Shazam11#"
echo ""
echo "💡 Press Ctrl+C to stop both servers"
echo "📱 For mobile testing, scan the QR code in the Expo DevTools"

# Wait for both processes to complete
wait $BACKEND_PID $FRONTEND_PID