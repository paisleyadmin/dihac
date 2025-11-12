#!/bin/bash

# Test script to verify all services are ready

echo "🧪 Testing DIHAC Setup..."
echo ""

# Test 1: Check Docker
echo "1. Checking Docker..."
if docker info > /dev/null 2>&1; then
    echo "   ✅ Docker is running"
else
    echo "   ❌ Docker is not running"
    exit 1
fi

# Test 2: Check Ollama
echo "2. Checking Ollama..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "   ✅ Ollama is running"
    MODELS=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | head -1)
    if [ -z "$MODELS" ]; then
        echo "   ⚠️  No models found. Run: ollama pull llama2"
    else
        echo "   ✅ Models available"
    fi
else
    echo "   ⚠️  Ollama is not running (required for LLM)"
    echo "      Start with: ollama serve"
fi

# Test 3: Check if services are running
echo "3. Checking backend services..."
cd "$(dirname "$0")"

if docker-compose ps | grep -q "Up"; then
    echo "   ✅ Some services are running"
    docker-compose ps
else
    echo "   ⚠️  Services are not running"
    echo "      Start with: docker-compose up -d"
fi

# Test 4: Check API Gateway
echo "4. Testing API Gateway..."
sleep 2
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo "   ✅ API Gateway is responding"
else
    echo "   ❌ API Gateway is not responding"
    echo "      Check logs: docker-compose logs api-gateway"
fi

# Test 5: Check MySQL
echo "5. Testing MySQL..."
if docker-compose exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
    echo "   ✅ MySQL is running"
else
    echo "   ⚠️  MySQL may not be ready yet"
fi

# Test 6: Check Node.js
echo "6. Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "   ✅ Node.js is installed: $NODE_VERSION"
else
    echo "   ❌ Node.js is not installed"
fi

# Test 7: Check frontend dependencies
echo "7. Checking frontend..."
if [ -d "frontend/node_modules" ]; then
    echo "   ✅ Frontend dependencies are installed"
else
    echo "   ⚠️  Frontend dependencies not installed"
    echo "      Run: cd frontend && npm install"
fi

echo ""
echo "✅ Setup check complete!"
echo ""
echo "To start everything:"
echo "  1. Start Ollama: ollama serve (in one terminal)"
echo "  2. Start backend: ./start.sh (or docker-compose up -d)"
echo "  3. Start frontend: cd frontend && npm start"

