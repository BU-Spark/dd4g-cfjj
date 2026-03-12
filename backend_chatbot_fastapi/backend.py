"""
FastAPI Backend for SRO Complaints Chatbot
Simple and clean API with 2 routes: /ingest and /query
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import io

from src.chatbot.services.ingestion_service import IngestionService
from src.chatbot.services.rag_service import RAGService
from src.chatbot.config.settings import settings
from src.chatbot.models.schemas import RAGQueryResponse, ProcessingResult
from src.chatbot.utils.logger import setup_logger
from src.chatbot.utils.exceptions import IngestionError, RAGError
from src.chatbot.utils.cache import query_cache, corpus_cache
from src.chatbot.utils.rate_limiter import query_rate_limiter

logger = setup_logger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="SRO Complaints Chatbot API",
    description="Backend API for ingesting complaint data and querying with RAG",
    version="1.0.0"
)

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ingestion_service = IngestionService()
rag_service = RAGService()


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class QueryRequest(BaseModel):
    """Request model for querying"""
    question: str = Field(..., min_length=1, description="The question to ask")
    corpus_name: Optional[str] = Field(None, description="RAG corpus name (optional)")
    top_k: Optional[int] = Field(5, ge=1, le=20, description="Number of documents to retrieve")


class QueryResponse(BaseModel):
    """Response model for queries"""
    answer: str
    reasoning: str
    sources: list
    num_sources: int


class IngestionResponse(BaseModel):
    """Response model for ingestion"""
    status: str
    message: str
    gcs_uri: Optional[str] = None
    corpus_name: Optional[str] = None
    total_complaints: Optional[int] = None
    duplicates_removed: Optional[int] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    message: str


# ============================================================================
# API ROUTES
# ============================================================================

@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint - health check"""
    return HealthResponse(
        status="healthy",
        message="SRO Complaints Chatbot API is running"
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        message="API is operational"
    )


@app.post("/cache/clear")
async def clear_cache():
    """
    Clear all caches (query cache and corpus cache)

    Useful for debugging or forcing fresh API calls
    """
    query_cache.clear()
    corpus_cache.clear()
    logger.info("All caches cleared")
    return {
        "status": "success",
        "message": "All caches cleared successfully"
    }


@app.get("/cache/stats")
async def cache_stats():
    """
    Get cache statistics

    Returns information about cached entries
    """
    return {
        "query_cache_size": query_cache.size(),
        "corpus_cache_size": corpus_cache.size(),
        "rate_limit_info": "10 requests per minute"
    }


@app.get("/corpus/status")
async def corpus_status():
    """
    Check corpus status and availability

    Returns information about available corpora
    """
    try:
        from vertexai.preview import rag

        # Check cache first
        cached_corpus = corpus_cache.get("default_corpus_name")

        if cached_corpus:
            return {
                "status": "available",
                "corpus_name": cached_corpus,
                "source": "cache",
                "message": "Corpus is available and ready for queries"
            }

        # List corpora
        logger.info("Checking corpus status...")
        corpora = rag.list_corpora()

        if corpora:
            corpus_name = corpora[0].name
            # Cache it
            corpus_cache.set("default_corpus_name", corpus_name)

            return {
                "status": "available",
                "corpus_name": corpus_name,
                "source": "vertex_ai",
                "total_corpora": len(corpora),
                "message": "Corpus is available and ready for queries"
            }
        else:
            return {
                "status": "not_found",
                "corpus_name": None,
                "message": "No corpus found. Please ingest data using /ingest endpoint first."
            }

    except Exception as e:
        logger.error(f"Error checking corpus status: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to check corpus status: {str(e)}"
        }


@app.get("/corpus/files")
async def list_corpus_files():
    """
    List all files in the RAG corpus

    Returns a list of files that have been ingested into the corpus
    """
    try:
        from vertexai.preview import rag

        # Get corpus name from cache or list corpora
        corpus_name = corpus_cache.get("default_corpus_name")

        if not corpus_name:
            logger.info("Listing corpora to find files...")
            corpora = list(rag.list_corpora())
            if not corpora:
                return {
                    "files": [],
                    "total": 0,
                    "message": "No corpus found. Please upload data first."
                }
            corpus_name = corpora[0].name
            corpus_cache.set("default_corpus_name", corpus_name)

        # List files in the corpus
        logger.info(f"Listing files in corpus: {corpus_name}")
        files = list(rag.list_files(corpus_name=corpus_name))

        file_list = []
        for file in files:
            file_list.append({
                "name": file.name,
                "display_name": file.display_name or file.name.split('/')[-1],
                "size_bytes": getattr(file, 'size_bytes', None),
                "create_time": getattr(file, 'create_time', None),
            })

        return {
            "files": file_list,
            "total": len(file_list),
            "corpus_name": corpus_name
        }

    except Exception as e:
        logger.error(f"Error listing corpus files: {str(e)}")
        return {
            "files": [],
            "total": 0,
            "error": str(e)
        }


@app.post("/ingest", response_model=IngestionResponse)
async def ingest_data(file: UploadFile = File(...)):
    """
    Ingest complaint data from CSV/Excel file

    This endpoint:
    1. Validates the uploaded file
    2. Processes and cleans the data
    3. Converts to JSONL format
    4. Uploads to GCS
    5. Creates/updates RAG corpus
    6. Imports data into Vertex AI RAG

    Args:
        file: CSV or Excel file with complaint data

    Returns:
        IngestionResponse with processing details
    """
    try:
        logger.info(f"Received file for ingestion: {file.filename}")

        # Validate file type
        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in ['csv', 'xlsx', 'xls']:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file_extension}. Please upload CSV or Excel file."
            )

        # Read file content
        content = await file.read()

        # Create a file-like object for the ingestion service
        class UploadedFile:
            def __init__(self, name, content):
                self.name = name
                self.file = io.BytesIO(content)

            def read(self, size=-1):
                return self.file.read(size)

            def seek(self, position):
                return self.file.seek(position)

        uploaded_file = UploadedFile(file.filename, content)

        # Process the file through ingestion pipeline
        result: ProcessingResult = ingestion_service.process_file(uploaded_file)

        logger.info(f"Ingestion completed successfully: {result.total_complaints} complaints processed")

        return IngestionResponse(
            status="success",
            message=f"Successfully processed {result.total_complaints} complaints",
            gcs_uri=result.gcs_uri,
            corpus_name=result.corpus_name,
            total_complaints=result.total_complaints,
            duplicates_removed=result.duplicates_removed
        )

    except IngestionError as e:
        logger.error(f"Ingestion error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        logger.error(f"Unexpected error during ingestion: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")


@app.post("/query", response_model=QueryResponse)
async def query_chatbot(request: QueryRequest):
    """
    Query the RAG chatbot with a question

    This endpoint:
    1. Retrieves relevant documents from Vertex AI RAG corpus
    2. Builds context from retrieved documents
    3. Generates answer using Gemini
    4. Returns answer with sources and reasoning

    Args:
        request: QueryRequest with question and optional parameters

    Returns:
        QueryResponse with answer, reasoning, and sources
    """
    try:
        logger.info(f"Received query: {request.question[:100]}...")

        # Check rate limit first (before even checking cache)
        if not query_rate_limiter.is_allowed("global"):
            wait_time = query_rate_limiter.get_wait_time("global")
            logger.warning(f"Rate limit exceeded. Wait {wait_time:.1f}s before next request")
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Please wait {wait_time:.1f} seconds before making another request. "
                       f"This protects against API quota exhaustion."
            )

        # Check cache first (cache key includes question + top_k)
        cache_key = f"{request.question}:{request.top_k}"
        cached_response = query_cache.get(cache_key)

        if cached_response:
            logger.info("Returning cached response (reduces API calls)")
            return QueryResponse(**cached_response)

        # Use provided corpus name or get from cache/settings
        corpus_name = request.corpus_name

        # If no corpus name provided, try to get from cache first
        if not corpus_name:
            # Check cache for corpus name (avoid listing corpora on every request)
            corpus_name = corpus_cache.get("default_corpus_name")

            if not corpus_name:
                # Only list corpora if not in cache
                try:
                    from vertexai.preview import rag
                    logger.info("Listing corpora (first time or cache expired)...")
                    corpora = rag.list_corpora()
                    if corpora:
                        corpus_name = corpora[0].name
                        # Cache the corpus name for 1 hour to avoid repeated API calls
                        corpus_cache.set("default_corpus_name", corpus_name)
                        logger.info(f"Using and caching corpus: {corpus_name}")
                    else:
                        # No corpus found - return a graceful response instead of error
                        logger.warning("No corpus found. Returning empty corpus message.")
                        return QueryResponse(
                            answer="I don't have any corpus data available to answer your question. Please upload complaint data using the /ingest endpoint first.",
                            reasoning="No corpus available",
                            sources=[],
                            num_sources=0
                        )
                except Exception as e:
                    # Error checking corpus - return graceful response
                    logger.error(f"Error checking corpus: {str(e)}")
                    return QueryResponse(
                        answer="I don't have any corpus data available to answer your question. Please upload complaint data using the /ingest endpoint first.",
                        reasoning="Corpus check failed",
                        sources=[],
                        num_sources=0
                    )
            else:
                logger.info(f"Using cached corpus: {corpus_name}")

        # Query the RAG service
        result: RAGQueryResponse = rag_service.query(
            corpus_name=corpus_name,
            question=request.question,
            top_k=request.top_k
        )

        logger.info(f"Query completed successfully with {result.num_sources} sources")

        # Convert to response format
        response_data = {
            "answer": result.answer,
            "reasoning": result.reasoning,
            "sources": [source.dict() for source in result.sources],
            "num_sources": result.num_sources
        }

        # Cache the response for 5 minutes
        query_cache.set(cache_key, response_data)
        logger.info(f"Cached response for query (cache size: {query_cache.size()})")

        return QueryResponse(**response_data)

    except RAGError as e:
        logger.error(f"RAG error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Unexpected error during query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process query: {str(e)}")


# ============================================================================
# STARTUP/SHUTDOWN EVENTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info("Starting SRO Complaints Chatbot API...")
    logger.info(f"GCP Project: {settings.gcp_project_id}")
    logger.info(f"GCS Bucket: {settings.gcs_bucket_name}")
    logger.info(f"Vertex AI Location: {settings.vertex_ai_location}")
    logger.info("API ready to accept requests")


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info("Shutting down SRO Complaints Chatbot API...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
