# SRO Complaints Chatbot

A modular RAG-powered chatbot for analyzing POST Commission complaint records involving School Resource Officers (SROs).

**Backend**: FastAPI RESTful API with Vertex AI RAG and Gemini
**Frontend**: React UI (being built separately)

## Project Structure

```
chatbot/
├── backend.py                    # FastAPI backend (main entry point)
├── src/chatbot/                  # Main application package
│   ├── config/                  # Configuration management
│   │   └── settings.py          # Centralized settings (env vars)
│   ├── models/                  # Data models
│   │   └── schemas.py           # Pydantic models for validation
│   ├── services/                # Business logic
│   │   ├── gcs_service.py       # Google Cloud Storage operations
│   │   ├── ingestion_service.py # Data ingestion pipeline
│   │   └── rag_service.py       # RAG querying with Gemini
│   └── utils/                   # Utility modules
│       ├── cache.py             # Response caching (reduces API calls)
│       ├── rate_limiter.py      # Rate limiting (prevents quota exhaustion)
│       ├── exceptions.py        # Custom exceptions
│       ├── logger.py            # Logging configuration
│       └── validators.py        # Input validation
├── archive/                     # Old Streamlit UI (archived)
├── requirements.txt             # Production dependencies
├── requirements-dev.txt         # Development dependencies
├── .env                         # Environment variables (not in git)
├── CLAUDE.md                    # Technical documentation
└── QUOTA_TROUBLESHOOTING.md     # Quota management guide
```

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

For development:
```bash
pip install -r requirements-dev.txt
```

### 2. Configure Environment

Create a `.env` file in the project root:

```bash
# GCP Configuration
GCP_PROJECT_ID=dd4g-cfjj-chatbot
GCS_BUCKET_NAME=sro-complaints-data-dd4g-cfjj-chatbot
LOCATION=us-east5

# Google AI API Key (for Gemini)
GOOGLE_API_KEY=your-api-key-here

# Gemini Model
GEMINI_MODEL=gemini-2.5-flash

# Cache Configuration (optional)
QUERY_CACHE_TTL=300          # 5 minutes
CORPUS_CACHE_TTL=3600        # 1 hour

# Rate Limiting (optional)
MAX_REQUESTS_PER_MINUTE=10   # Prevent quota exhaustion
```

### 3. Run the FastAPI Backend

**Option 1: Direct Python**
```bash
python backend.py
```

**Option 2: Using uvicorn (recommended)**
```bash
uvicorn backend:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **Base URL**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## API Endpoints

### Health & Status
- `GET /` - Health check
- `GET /health` - API status
- `GET /cache/stats` - Cache statistics
- `GET /corpus/status` - Corpus availability status
- `POST /cache/clear` - Clear all caches

### Data Management
- `POST /ingest` - Upload and process complaint data (CSV/Excel)

### Querying
- `POST /query` - Ask questions about the data

## Usage

### 1. Upload Data (Ingest)

```bash
curl -X POST "http://localhost:8000/ingest" \
  -F "file=@complaints.csv"
```

**Response:**
```json
{
  "status": "success",
  "message": "Successfully processed 458 complaints",
  "gcs_uri": "gs://bucket-name/data/complaints_1234567890.jsonl",
  "corpus_name": "projects/.../corpora/123",
  "total_complaints": 458,
  "duplicates_removed": 12
}
```

### 2. Ask Questions (Query)

```bash
curl -X POST "http://localhost:8000/query" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the demographic breakdown of complaints?",
    "top_k": 5
  }'
```

**Response:**
```json
{
  "answer": "Based on the complaint data...",
  "reasoning": "Answer based on Vertex AI RAG retrieval and Gemini analysis",
  "sources": [...],
  "num_sources": 5
}
```

### Example Questions

- What is the demographic breakdown of youth in complaints?
- Which police departments have the most complaints?
- Is there a correlation between elementary school age and SRO complaints?
- What patterns exist in complaints involving youth under age 12?
- Should SROs be placed in elementary schools based on this data?

## Architecture

### FastAPI Backend
- **RESTful API**: Clean endpoint design with automatic OpenAPI docs
- **CORS Enabled**: Ready for frontend integration
- **Error Handling**: Graceful error responses with proper HTTP status codes

### Config Module
- **Purpose**: Centralized configuration using Pydantic
- **Key Features**:
  - Environment variable validation
  - Type safety
  - Default values
  - Configurable caching and rate limiting

### Services Layer
- **GCS Service**: Handles file uploads to Google Cloud Storage
- **Ingestion Service**: Processes CSV/Excel files and creates Vertex AI RAG corpus
- **RAG Service**: Queries Vertex AI RAG and generates answers with Gemini
  - Corpus-only responses (no external knowledge)
  - Out-of-scope question detection
  - Empty corpus handling

### Optimization Layer
- **Response Caching**: Reduces API calls by ~90% for repeated queries
- **Corpus Caching**: Eliminates repeated corpus lookups
- **Rate Limiting**: Prevents quota exhaustion (configurable)

### Data Models
- **Pydantic Models**: Type-safe data validation
- **Schemas**: ComplaintRecord, ProcessingResult, RAGQueryResponse, Source

## Development

### Running Tests

```bash
pytest tests/
```

### Code Formatting

```bash
black src/
```

### Linting

```bash
ruff check src/
```

### Type Checking

```bash
mypy src/
```

## Key Features

1. **Separation of Concerns**: Config, models, services, and API are clearly separated
2. **Type Safety**: Pydantic models provide automatic validation
3. **Better Error Handling**: Custom exceptions and proper logging
4. **Quota Management**: Built-in caching and rate limiting to prevent API quota exhaustion
5. **Corpus-Focused Responses**: Model only answers based on ingested data
6. **Graceful Degradation**: Returns friendly messages when corpus is empty or question is out of scope
7. **Testability**: Services can be tested independently
8. **Maintainability**: Smaller, focused modules
9. **Scalability**: Easy to add new features
10. **Production Ready**: Proper logging, configuration, and error handling

## Performance Optimizations

### Response Caching
- Identical queries return cached results for 5 minutes
- **Reduces Gemini API calls by ~90%**
- Configurable TTL via `QUERY_CACHE_TTL`

### Corpus Caching
- Corpus name cached for 1 hour
- **Eliminates repeated `list_corpora()` API calls**
- Saves API quota and improves response time

### Rate Limiting
- Default: 10 requests per minute
- Prevents accidental quota exhaustion
- Configurable via `MAX_REQUESTS_PER_MINUTE`

## Model Behavior

The chatbot is designed to be **strictly corpus-focused**:

1. **No Corpus Available** → Returns: "I don't have any corpus data available..."
2. **Corpus Empty or No Relevant Docs** → Returns: "The available complaint data does not contain sufficient information..."
3. **Out of Scope Question** → Returns: "This question is out of scope. I can only answer questions about the SRO complaint data..."
4. **Valid Question with Data** → Provides detailed analysis based solely on complaint data

**Important**: The model will NOT use external knowledge. It only answers based on the ingested complaint records.

## Troubleshooting

### Quota Exceeded Error (429)
If you see `429 You exceeded your current quota`:

1. **Wait for quota reset** (resets at midnight Pacific Time)
2. **Get a new API key** from https://aistudio.google.com/app/apikey
3. **Enable billing** in Google Cloud Console for higher quotas
4. See `QUOTA_TROUBLESHOOTING.md` for detailed guidance

### Cache Issues
- Clear cache: `POST http://localhost:8000/cache/clear`
- Check stats: `GET http://localhost:8000/cache/stats`

### Corpus Not Found
- Check status: `GET http://localhost:8000/corpus/status`
- Upload data: `POST http://localhost:8000/ingest`

## Documentation

- **CLAUDE.md**: Comprehensive technical documentation
- **QUOTA_TROUBLESHOOTING.md**: Quota management and troubleshooting guide
- **API Docs**: http://localhost:8000/docs (when server is running)

## Client Information

- **Client**: Citizens for Juvenile Justice (CFJJ)
- **Contact**: Josh Dankoff (joshuadankoff@cfjj.org)
- **Data Source**: Massachusetts POST Commission PRR Dataset
- **Purpose**: Analyze patterns in SRO complaints involving youth under 18

## Technology Stack

- **Backend**: FastAPI + Python 3.9+
- **Cloud Platform**: Google Cloud Platform (GCP)
- **AI Services**: Vertex AI RAG Engine + Gemini API
- **Storage**: Google Cloud Storage
- **Frontend**: React (being built by team member)

## License

Built for SPARK-CDS-DD4G Program | Boston University | Spring 2026

---

**Last Updated**: 2026-03-11
**Status**: Development - FastAPI backend ready for frontend integration
