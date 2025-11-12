# DIHAC Project Summary

## Overview

DIHAC (Do I Have A Case?) is a comprehensive legal case analysis application that helps users determine if their rights have been violated through an intelligent conversational interface powered by a local LLM.

## Project Structure

```
dihac/
├── backend/
│   ├── api-gateway/          # API Gateway service
│   ├── services/
│   │   ├── user-service/      # Authentication & user management
│   │   ├── conversation-service/  # Chat/conversation handling
│   │   ├── analysis-service/      # LLM integration & case analysis
│   │   ├── legal-research-service/ # Laws & precedents lookup
│   │   ├── report-service/        # PDF report generation
│   │   └── evidence-service/      # File uploads & evidence
│   └── database/
│       └── init.sql          # Database schema
├── frontend/                  # React.js web application
├── mobile/                    # React Native mobile app
├── deployment/                # Cloud deployment configs
│   ├── kubernetes/           # K8s manifests
│   └── aws/                  # AWS CloudFormation
├── docker-compose.yml        # Local development setup
├── README.md                 # Main documentation
├── SETUP.md                  # Setup guide
├── ARCHITECTURE.md           # Architecture documentation
└── LLM_SETUP.md             # LLM configuration guide
```

## Key Features

### 1. Conversational Interface
- Chat-based interaction to describe legal situations
- AI-powered clarifying questions
- Voice input support (future)
- Real-time conversation history

### 2. Intelligent Analysis
- Case strength indicator (thumbs up/down)
- Win probability percentage
- Strengths and weaknesses analysis
- Recommendations

### 3. Legal Research
- Relevant laws with hyperlinks
- Precedent cases
- Legal context and citations
- Relevance scoring

### 4. Evidence Management
- File uploads (documents, images, etc.)
- Witness information collection
- Evidence organization

### 5. Legal Contacts
- Top 5 recommended law firms
- Contact information
- Specialization matching
- Ratings and rankings

### 6. Case Reports
- Comprehensive PDF reports
- Downloadable format
- Email-ready
- Print-friendly

## Technology Stack

### Backend
- **Language**: Python 3.11
- **Framework**: FastAPI
- **Database**: MySQL 8.0
- **ORM**: SQLAlchemy
- **Authentication**: JWT
- **LLM**: Local (Ollama/Mistral)

### Frontend
- **Framework**: React.js 18
- **UI Library**: Material-UI
- **HTTP Client**: Axios
- **Routing**: React Router

### Mobile
- **Framework**: React Native
- **Navigation**: React Navigation
- **Storage**: AsyncStorage

### Infrastructure
- **Containers**: Docker
- **Orchestration**: Docker Compose (local), Kubernetes (production)
- **Cloud**: AWS/Azure/GCP ready
- **CDN**: CloudFront/Azure Front Door/Cloud CDN
- **Load Balancing**: Application Load Balancer/Ingress

## Services Architecture

1. **API Gateway** (Port 8000)
   - Single entry point
   - Request routing
   - CORS handling

2. **User Service** (Port 8001)
   - Registration
   - Authentication
   - User management

3. **Conversation Service** (Port 8002)
   - Message handling
   - Conversation storage
   - History management

4. **Analysis Service** (Port 8003)
   - LLM integration
   - Case analysis
   - RAG implementation

5. **Legal Research Service** (Port 8004)
   - Law lookup
   - Precedent search
   - Contact recommendations

6. **Report Service** (Port 8005)
   - PDF generation
   - Report formatting

7. **Evidence Service** (Port 8006)
   - File uploads
   - Evidence storage
   - Witness management

## Database Schema

- **users**: User accounts
- **cases**: Legal cases
- **conversations**: Chat messages
- **evidence**: Uploaded files
- **witnesses**: Witness information
- **relevant_laws**: Legal statutes
- **precedent_cases**: Case precedents
- **legal_contacts**: Law firm recommendations
- **case_analysis**: Analysis results
- **rag_documents**: RAG knowledge base

## Getting Started

1. **Prerequisites**: Docker, Node.js, Python, MySQL
2. **LLM Setup**: Install Ollama and pull a model (see LLM_SETUP.md)
3. **Backend**: `docker-compose up -d`
4. **Frontend**: `cd frontend && npm install && npm start`
5. **Mobile**: `cd mobile && npm install && npm run ios/android`

See SETUP.md for detailed instructions.

## Deployment

### Local Development
- Docker Compose for all services
- Local MySQL database
- Local LLM server

### Production
- Kubernetes for orchestration
- Managed database (RDS/Azure SQL/Cloud SQL)
- Cloud storage (S3/Azure Blob/GCS)
- CDN for static assets
- Load balancers
- Auto-scaling

See deployment/ directory for configurations.

## Security Considerations

- JWT authentication
- HTTPS/TLS encryption
- Input validation
- SQL injection prevention
- CORS configuration
- Rate limiting (to be implemented)
- Secrets management

## Performance Optimization

- Horizontal scaling
- Database connection pooling
- Caching (Redis - to be implemented)
- CDN for static assets
- Load balancing
- Database indexing

## Future Enhancements

1. **Advanced RAG**
   - Vector database integration
   - Semantic search
   - Legal document embeddings

2. **Voice Features**
   - Speech-to-text
   - Voice responses
   - Multi-language support

3. **Analytics**
   - Case outcome tracking
   - Success rate metrics
   - User behavior analysis

4. **Integrations**
   - Legal database APIs
   - Court filing systems
   - Document management

5. **AI Improvements**
   - Fine-tuned legal models
   - Multi-model ensemble
   - Confidence scoring

## Cost Optimization

- Local LLM to avoid API costs
- Efficient resource allocation
- Auto-scaling
- Caching strategies
- Cloud provider comparison

## Support & Documentation

- **README.md**: Main documentation
- **SETUP.md**: Setup instructions
- **ARCHITECTURE.md**: Architecture details
- **LLM_SETUP.md**: LLM configuration
- **deployment/**: Deployment guides

## License

MIT License

## Contributing

This is a personal project. For questions or issues, refer to the documentation files.

