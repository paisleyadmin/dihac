#!/bin/bash

# DIHAC Quick Start Script
# This script helps you start all services locally

echo "🚀 Starting DIHAC Application..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Ollama doesn't seem to be running."
    echo "   Please start Ollama in another terminal: ollama serve"
    echo "   And pull a model: ollama pull llama2"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📦 Starting backend services with Docker Compose..."
cd "$(dirname "$0")"
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo "🔍 Checking service health..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ API Gateway is running"
else
    echo "❌ API Gateway is not responding"
fi

echo ""
echo "✅ Backend services are starting!"
echo ""
echo "📋 Service Status:"
docker-compose ps

echo ""
echo "🌐 Next steps:"
echo "   1. Start the frontend: cd frontend && npm install && npm start"
echo "   2. Open http://localhost:3000 in your browser"
echo ""
echo "📊 View logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"

