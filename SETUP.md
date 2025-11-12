# DIHAC Setup Guide

Complete setup guide for the DIHAC application.

## Prerequisites

- Docker and Docker Compose
- Python 3.11+
- Node.js 18+
- MySQL 8.0+ (or use Docker)
- Local LLM server (Ollama recommended - see LLM_SETUP.md)

## Quick Start

### 1. Clone and Setup

```bash
cd dihac
```

### 2. Configure Environment

Copy and edit environment variables:
```bash
# Create .env file from example
cp .env.example .env
# Edit .env with your settings
```

Key settings to configure:
- `LLM_SERVICE_URL`: URL of your local LLM (default: http://host.docker.internal:11434)
- `MYSQL_PASSWORD`: Database password
- `JWT_SECRET`: Secret key for JWT tokens

### 3. Start Local LLM

Before starting services, ensure your LLM is running:

```bash
# Using Ollama (recommended)
ollama serve
# In another terminal, pull a model:
ollama pull llama2
```

See `LLM_SETUP.md` for detailed LLM setup instructions.

### 4. Start Backend Services

```bash
# Start all services with Docker Compose
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

Services will be available at:
- API Gateway: http://localhost:8000
- User Service: http://localhost:8001
- Conversation Service: http://localhost:8002
- Analysis Service: http://localhost:8003
- Legal Research Service: http://localhost:8004
- Report Service: http://localhost:8005
- Evidence Service: http://localhost:8006
- MySQL: localhost:3306

### 5. Setup Frontend

```bash
cd frontend
npm install
npm start
```

Frontend will be available at http://localhost:3000

### 6. Setup Mobile App (Optional)

```bash
cd mobile
npm install

# For iOS
cd ios && pod install && cd ..
npm run ios

# For Android
npm run android
```

## Development

### Running Services Individually

Instead of Docker Compose, you can run services individually:

```bash
# User Service
cd backend/services/user-service
pip install -r requirements.txt
python main.py

# Conversation Service
cd backend/services/conversation-service
pip install -r requirements.txt
python main.py

# ... and so on for other services
```

### Database Migrations

The database schema is automatically created on first run via `backend/database/init.sql`.

To manually run migrations:
```bash
mysql -u dihac_user -p dihac < backend/database/init.sql
```

### Testing

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

## Production Deployment

### Cloud Deployment Options

1. **AWS**: Use ECS/EKS with Application Load Balancer and CloudFront CDN
2. **Azure**: Use AKS with Azure Front Door
3. **GCP**: Use GKE with Cloud Load Balancing and Cloud CDN

See `deployment/` directory for:
- Kubernetes manifests
- AWS CloudFormation templates
- Deployment guides

### Key Production Considerations

1. **Security**:
   - Change all default passwords
   - Use strong JWT secrets
   - Enable HTTPS/TLS
   - Configure CORS properly
   - Use secrets management (AWS Secrets Manager, Azure Key Vault, etc.)

2. **Scaling**:
   - Use horizontal pod autoscaling in Kubernetes
   - Configure load balancers
   - Use CDN for static assets
   - Database connection pooling

3. **Monitoring**:
   - Set up logging (ELK stack, CloudWatch, etc.)
   - Configure health checks
   - Set up alerts
   - Monitor LLM performance

4. **Database**:
   - Use managed database service (RDS, Azure SQL, Cloud SQL)
   - Set up backups
   - Configure read replicas for scaling

5. **LLM**:
   - Consider using cloud LLM services for production
   - Or deploy LLM on dedicated GPU instances
   - Monitor token usage and costs

## Troubleshooting

### Services not starting

Check logs:
```bash
docker-compose logs [service-name]
```

### Database connection issues

Verify MySQL is running:
```bash
docker-compose ps mysql
docker-compose logs mysql
```

### LLM connection issues

Test LLM directly:
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama2",
  "prompt": "test",
  "stream": false
}'
```

### Frontend not connecting to backend

Check API URL in `frontend/src/contexts/AuthContext.js`:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
```

## Architecture Overview

```
┌─────────────┐
│   React.js  │
│   Frontend  │
└──────┬──────┘
       │
┌──────▼──────────┐
│  API Gateway    │
└──────┬──────────┘
       │
   ┌───┴───┬────────┬────────┬────────┬────────┬────────┐
   │       │        │        │        │        │        │
┌──▼──┐ ┌─▼──┐  ┌──▼──┐  ┌──▼──┐  ┌──▼──┐  ┌──▼──┐  ┌──▼──┐
│User │ │Conv│  │Analy│  │Legal│  │Repor│  │Evid │  │MySQL│
│Serv │ │Serv│  │Serv │  │Serv │  │Serv │  │Serv │  │     │
└─────┘ └────┘  └──┬──┘  └─────┘  └─────┘  └─────┘  └─────┘
                   │
              ┌────▼────┐
              │Local LLM│
              │(Ollama) │
              └─────────┘
```

## Next Steps

1. Set up RAG with legal documents
2. Integrate with legal databases for laws and precedents
3. Add voice input support
4. Enhance mobile app features
5. Set up CI/CD pipeline
6. Configure monitoring and alerting

## Support

For issues or questions, please check:
- README.md
- LLM_SETUP.md
- deployment/kubernetes/README.md

