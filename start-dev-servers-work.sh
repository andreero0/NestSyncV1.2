#!/bin/bash

# NestSync Development Server Startup Script for Work Computer
# This script starts both backend and frontend development servers

echo "🚀 Starting NestSync Development Environment..."
echo "=================================================="

# Check if we're in the correct directory
if [ ! -d "NestSync-backend" ] || [ ! -d "NestSync-frontend" ]; then
    echo "❌ Error: Please run this script from the NestSync project root directory"
    exit 1
fi

# Function to kill existing processes on ports
cleanup_ports() {
    echo "🧹 Cleaning up existing processes on ports 8001 and 8082..."
    
    # Kill processes on port 8001 (backend)
    lsof -ti:8001 | xargs kill -9 2>/dev/null || true
    
    # Kill processes on port 8082 (frontend) 
    lsof -ti:8082 | xargs kill -9 2>/dev/null || true
    
    echo "✅ Port cleanup complete"
}

# Function to start backend server
start_backend() {
    echo "🔧 Starting Backend Server (FastAPI + GraphQL)..."
    cd NestSync-backend
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "❌ Python virtual environment not found. Please run setup first:"
        echo "   cd NestSync-backend"
        echo "   python -m venv venv"
        echo "   source venv/bin/activate"
        echo "   pip install -r requirements.txt"
        exit 1
    fi
    
    # Check if .env.local exists
    if [ ! -f ".env.local" ]; then
        echo "⚠️  Warning: .env.local not found. Using .env.example"
        if [ ! -f ".env" ]; then
            cp .env.example .env
        fi
    fi
    
    # Start backend in background
    source venv/bin/activate
    uvicorn main:app --host 0.0.0.0 --port 8001 --reload &
    BACKEND_PID=$!
    
    cd ..
    echo "✅ Backend server starting on http://localhost:8001"
    echo "   GraphQL Playground: http://localhost:8001/graphql"
}

# Function to start frontend server
start_frontend() {
    echo "📱 Starting Frontend Server (Expo + React Native)..."
    cd NestSync-frontend
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "❌ Node modules not found. Please run: npm install"
        exit 1
    fi
    
    # Start frontend in background
    npx expo start --port 8082 --web &
    FRONTEND_PID=$!
    
    cd ..
    echo "✅ Frontend server starting on http://localhost:8082"
}

# Function to monitor servers
monitor_servers() {
    echo ""
    echo "🎯 Development Environment Ready!"
    echo "=================================================="
    echo "🔧 Backend (FastAPI):  http://localhost:8001"
    echo "📱 Frontend (Expo):    http://localhost:8082"
    echo "🔍 GraphQL Playground: http://localhost:8001/graphql"
    echo ""
    echo "Test Credentials:"
    echo "📧 Email: parents@nestsync.com"
    echo "🔒 Password: Shazam11#"
    echo ""
    echo "Press Ctrl+C to stop all servers"
    echo "=================================================="
    
    # Wait for user interrupt
    trap 'echo "🛑 Shutting down servers..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT
    
    # Keep script running
    wait
}

# Main execution
cleanup_ports
start_backend
sleep 3  # Give backend time to start
start_frontend
sleep 2  # Give frontend time to start
monitor_servers