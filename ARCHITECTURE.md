# DIHAC Architecture

## System Architecture

DIHAC is built as a microservices-based application with the following components:

### Frontend Layer

1. **React.js Web Application** (`frontend/`)
   - User interface for web browsers
   - Material-UI components
   - Responsive design
   - Real-time chat interface

2. **React Native Mobile Application** (`mobile/`)
   - iOS and Android support
   - Native mobile experience
   - Voice input support (future)

### API Gateway

**API Gateway** (`backend/api-gateway/`)
- Single entry point for all client requests
- Request routing to appropriate microservices
- CORS handling
- Request/response transformation
- Load balancing (in production)

### Microservices

1. **User Service** (`backend/services/user-service/`)
   - User registration and authentication
   - JWT token management
   - User profile management

2. **Conversation Service** (`backend/services/conversation-service/`)
   - Manages chat conversations
   - Stores conversation history
   - Coordinates with Analysis Service

3. **Analysis Service** (`backend/services/analysis-service/`)
   - LLM integration
   - Case analysis and evaluation
   - RAG (Retrieval-Augmented Generation)
   - Generates clarifying questions
   - Determines case strength and win probability

4. **Legal Research Service** (`backend/services/legal-research-service/`)
   - Finds relevant laws
   - Searches precedent cases
   - Recommends legal contacts/law firms
   - Integrates with legal databases

5. **Report Service** (`backend/services/report-service/`)
   - Generates PDF case reports
   - Includes all case information
   - Downloadable format

6. **Evidence Service** (`backend/services/evidence-service/`)
   - File upload handling
   - Evidence management
   - Witness information storage

### Data Layer

**MySQL Database**
- Centralized database for all services
- Tables: users, cases, conversations, evidence, witnesses, relevant_laws, precedent_cases, legal_contacts, case_analysis, rag_documents

### LLM Integration

**Local LLM (Mac Studio Max)**
- Runs Ollama or similar LLM server
- Processes natural language queries
- Generates responses and analysis
- RAG-enhanced responses

## Data Flow

### User Conversation Flow

1. User sends message via Frontend
2. Frontend → API Gateway
3. API Gateway → Conversation Service
4. Conversation Service → Analysis Service
5. Analysis Service → Local LLM (with RAG context)
6. LLM → Analysis Service (response + questions)
7. Analysis Service → Conversation Service
8. Conversation Service → API Gateway
9. API Gateway → Frontend
10. User sees response

### Case Analysis Flow

1. User clicks "Analyze Case"
2. Frontend → API Gateway → Analysis Service
3. Analysis Service:
   - Retrieves all conversations
   - Calls LLM for comprehensive analysis
   - Determines case indicator (thumbs up/down)
   - Calculates win probability
4. Analysis Service → Legal Research Service
5. Legal Research Service:
   - Finds relevant laws
   - Finds precedent cases
   - Recommends legal contacts
6. All results saved to database
7. Results returned to Frontend

### Report Generation Flow

1. User clicks "Download Report"
2. Frontend → API Gateway → Report Service
3. Report Service:
   - Retrieves case data
   - Retrieves conversations
   - Retrieves analysis
   - Retrieves laws and precedents
   - Retrieves contacts
4. Generates PDF
5. Returns PDF to Frontend
6. User downloads report

## Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MySQL 8.0
- **ORM**: SQLAlchemy
- **Authentication**: JWT
- **File Storage**: Local filesystem (can be upgraded to S3/Azure Blob)

### Frontend
- **Framework**: React.js
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
- **Load Balancing**: Application Load Balancer / Ingress Controller
- **CDN**: CloudFront / Azure Front Door / Cloud CDN

## Scalability

### Horizontal Scaling
- All services are stateless (except database)
- Can scale each service independently
- Use load balancers to distribute traffic
- Database can use read replicas

### Vertical Scaling
- LLM service can be scaled on GPU instances
- Database can be upgraded to larger instances
- Services can be allocated more resources

### Caching
- Implement Redis for session management
- Cache legal research results
- Cache LLM responses for similar queries

### Database Optimization
- Indexes on frequently queried columns
- Connection pooling
- Query optimization
- Read replicas for read-heavy operations

## Security

### Authentication & Authorization
- JWT tokens for API authentication
- Token expiration and refresh
- Role-based access control (future)

### Data Protection
- HTTPS/TLS for all communications
- Encrypted database connections
- Secure file storage
- Input validation and sanitization

### API Security
- Rate limiting
- Request validation
- CORS configuration
- API key management (for external services)

## Monitoring & Logging

### Logging
- Structured logging in all services
- Centralized log aggregation (ELK, CloudWatch, etc.)
- Error tracking and alerting

### Monitoring
- Health check endpoints
- Metrics collection (Prometheus, CloudWatch)
- Performance monitoring
- LLM usage tracking

### Alerting
- Service downtime alerts
- Error rate alerts
- Performance degradation alerts
- Database connection alerts

## Deployment

### Local Development
- Docker Compose for all services
- Hot reload for development
- Local MySQL database
- Local LLM server

### Production
- Kubernetes for orchestration
- Managed database service
- Cloud storage for files
- CDN for static assets
- Load balancers
- Auto-scaling groups
- Health checks and auto-recovery

## Cost Optimization

### Cloud Provider Selection
- Compare AWS, Azure, and GCP pricing
- Use reserved instances for predictable workloads
- Spot instances for non-critical services
- Serverless options where applicable

### Resource Optimization
- Right-size instances
- Use containerization for efficient resource usage
- Implement auto-scaling
- Cache frequently accessed data

### LLM Costs
- Use local LLM to avoid API costs
- Implement response caching
- Optimize prompts for efficiency
- Consider quantization for model size

## Future Enhancements

1. **Advanced RAG**
   - Vector database (ChromaDB, Pinecone)
   - Semantic search
   - Legal document embeddings

2. **Voice Input**
   - Speech-to-text integration
   - Voice response
   - Multi-language support

3. **Advanced Analytics**
   - Case outcome tracking
   - Success rate analytics
   - User behavior analysis

4. **Integration**
   - Legal database APIs
   - Court filing systems
   - Document management systems

5. **AI Improvements**
   - Fine-tuned legal models
   - Multi-model ensemble
   - Confidence scoring

