# DIHAC - "Do I Have A Case?"

A personal free legal retainer application that helps users determine if their rights have been violated through an intelligent conversational interface.

## 🚀 Quick Start

**Want to see it in action right now?** See [QUICKSTART.md](./QUICKSTART.md) for step-by-step instructions.

### TL;DR

```bash
# 1. Start Ollama (LLM) - in one terminal
ollama serve
# In another terminal:
ollama pull llama2

# 2. Start backend services - in project root
docker-compose up -d

# 3. Start frontend - in new terminal
cd frontend
npm install
npm start

# 4. Open http://localhost:3000
```

## Features

- **Conversational Interface**: Chat or voice interaction to describe legal situations
- **Intelligent Questioning**: AI-powered clarifying questions to gather complete information
- **Evidence Collection**: Upload and manage evidence and witness information
- **Case Analysis**: 
  - Quick thumbs up/down indicator
  - Win probability percentage
  - Relevant laws with hyperlinks
  - Precedent cases
  - Top 5 legal contacts/law firms
- **Case Report**: Downloadable PDF report for law firm consultations

## Architecture

### Technology Stack
- **Frontend**: React.js (Web), React Native (Mobile)
- **Backend**: Python FastAPI (Microservices)
- **Database**: MySQL
- **LLM**: Local open-source model (runs on Mac Studio Max)
- **RAG**: Retrieval-Augmented Generation for enhanced legal research
- **Deployment**: Docker containers, Kubernetes-ready, Cloud (AWS/Azure/GCP)

### Microservices
1. **API Gateway**: Entry point for all requests
2. **User Service**: Authentication and user management
3. **Conversation Service**: Chat/voice handling and conversation management
4. **Analysis Service**: LLM integration and case analysis
5. **Legal Research Service**: Laws and precedents lookup
6. **Report Service**: PDF generation
7. **Evidence Service**: File uploads and evidence management

## Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Get running in 5 minutes
- **[SETUP.md](./SETUP.md)** - Detailed setup instructions
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture
- **[LLM_SETUP.md](./LLM_SETUP.md)** - LLM configuration guide
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Project overview

## Prerequisites

- Docker and Docker Compose
- Python 3.11+
- Node.js 18+
- MySQL 8.0+ (or use Docker)
- Local LLM server (Ollama recommended)

## Local Development

### Backend Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### Mobile App

```bash
cd mobile
npm install
npm run ios  # or npm run android
```

## Testing

Test the API Gateway:
```bash
curl http://localhost:8000/health
```

Test user registration:
```bash
curl -X POST http://localhost:8000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "first_name": "Test",
    "last_name": "User"
  }'
```

## Service URLs

- Frontend: http://localhost:3000
- API Gateway: http://localhost:8000
- User Service: http://localhost:8001
- Conversation Service: http://localhost:8002
- Analysis Service: http://localhost:8003
- Legal Research Service: http://localhost:8004
- Report Service: http://localhost:8005
- Evidence Service: http://localhost:8006
- MySQL: localhost:3306
- Ollama (LLM): http://localhost:11434

## Deployment

See `deployment/` directory for cloud deployment configurations (Kubernetes, AWS, Azure, GCP).

## License

MIT
