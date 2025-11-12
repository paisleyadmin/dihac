# Quick Start Guide - Run DIHAC Locally

This guide will help you run the entire DIHAC application locally in minutes.

## Prerequisites Check

Before starting, ensure you have:
- ✅ Docker Desktop installed and running
- ✅ Node.js 18+ installed
- ✅ Ollama installed (for LLM)

## Step 1: Install and Start Ollama (LLM)

Open a terminal and run:

```bash
# If Ollama is not installed, install it:
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama server
ollama serve

# In a NEW terminal window, pull a model (this may take a few minutes):
ollama pull llama2
# OR for better performance:
ollama pull mistral
```

Keep the `ollama serve` terminal running. The LLM will be available at `http://localhost:11434`.

## Step 2: Start Backend Services

Open a new terminal window and navigate to the project:

```bash
cd /Users/majunu/dihac

# Start all microservices with Docker Compose
docker-compose up -d

# Check that all services are running
docker-compose ps
```

Wait for all services to be healthy (this may take 1-2 minutes). You can watch the logs:

```bash
# Watch all logs
docker-compose logs -f

# Or watch specific service
docker-compose logs -f api-gateway
```

## Step 3: Verify Backend is Running

Test the API Gateway:

```bash
curl http://localhost:8000/health
```

You should see: `{"status":"healthy","service":"api-gateway"}`

## Step 4: Start Frontend

Open a NEW terminal window:

```bash
cd /Users/majunu/dihac/frontend

# Install dependencies (first time only)
npm install

# Start the React app
npm start
```

The frontend will open automatically at `http://localhost:3000`

## Step 5: Test the Application

1. **Register a new account:**
   - Go to http://localhost:3000
   - Click "Register here"
   - Fill in your details and register

2. **Create a case:**
   - After login, click "New Case"
   - Start describing your legal situation
   - The AI will ask clarifying questions

3. **Analyze the case:**
   - After providing information, click "Analyze Case"
   - View the analysis with win probability, laws, and precedents

## Troubleshooting

### Services not starting?

```bash
# Check service status
docker-compose ps

# View logs for errors
docker-compose logs [service-name]

# Restart services
docker-compose restart
```

### Frontend can't connect to backend?

- Ensure backend services are running: `docker-compose ps`
- Check API Gateway is accessible: `curl http://localhost:8000/health`
- Verify frontend is using correct API URL (should be `http://localhost:8000`)

### LLM not responding?

```bash
# Test Ollama directly
curl http://localhost:11434/api/generate -d '{
  "model": "llama2",
  "prompt": "Hello",
  "stream": false
}'

# If this fails, ensure Ollama is running:
ollama serve
```

### Database connection issues?

```bash
# Check MySQL is running
docker-compose ps mysql

# View MySQL logs
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql
```

### Port already in use?

If ports 8000-8006 or 3306 are already in use:

1. Stop conflicting services, OR
2. Modify ports in `docker-compose.yml`

## Service URLs

Once running, services are available at:

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **User Service**: http://localhost:8001
- **Conversation Service**: http://localhost:8002
- **Analysis Service**: http://localhost:8003
- **Legal Research Service**: http://localhost:8004
- **Report Service**: http://localhost:8005
- **Evidence Service**: http://localhost:8006
- **MySQL**: localhost:3306
- **Ollama (LLM)**: http://localhost:11434

## Stop Everything

When done testing:

```bash
# Stop frontend (Ctrl+C in the frontend terminal)

# Stop all backend services
cd /Users/majunu/dihac
docker-compose down

# Stop Ollama (Ctrl+C in the Ollama terminal)
```

## Next Steps

- Read `SETUP.md` for detailed configuration
- Read `ARCHITECTURE.md` to understand the system
- Customize LLM settings in `.env` file
- Add legal documents to RAG database

Enjoy testing DIHAC! 🚀

