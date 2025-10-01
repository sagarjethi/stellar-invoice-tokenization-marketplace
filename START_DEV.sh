#!/bin/bash

# Start both development servers
# Make sure to update database password first!

echo "🚀 Starting Stellar Invoice Platform Development Servers..."
echo ""

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
  echo "❌ Error: backend/.env not found"
  exit 1
fi

if [ ! -f "frontend/.env" ]; then
  echo "❌ Error: frontend/.env not found"
  exit 1
fi

# Check if database password is still placeholder
if grep -q "****************" backend/.env; then
  echo "⚠️  WARNING: Database password is still a placeholder!"
  echo "   Please update backend/.env with your actual Neon password"
  echo "   Or run: ./scripts/update-db-password.sh YOUR_PASSWORD"
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "📦 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

echo "📦 Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Development servers started!"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
