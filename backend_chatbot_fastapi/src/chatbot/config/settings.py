"""
Configuration Module for SRO Complaints Chatbot
Centralized settings using Pydantic for validation
"""

from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    """Application settings with validation"""

    # GCP Configuration
    gcp_project_id: str
    gcs_bucket_name: str
    location: str = "us-east5"

    # Google AI Configuration
    google_api_key: str
    gemini_model: str = "gemini-2.5-flash"

    # Vertex AI Configuration
    vertex_ai_location: str = "us-east5"  # For RAG operations

    # RAG Corpus Configuration
    corpus_display_name: str = "sro-complaints-corpus"
    chunk_size: int = 512
    chunk_overlap: int = 100
    similarity_top_k: int = 5

    # Data Processing Configuration
    max_narrative_length: int = 2000
    max_allegations_length: int = 500

    # Cache Configuration
    query_cache_ttl: int = 300  # 5 minutes
    corpus_cache_ttl: int = 3600  # 1 hour

    # Rate Limiting Configuration
    max_requests_per_minute: int = 10  # Conservative limit to avoid quota exhaustion

    # Optional: Service Account Key Path
    google_application_credentials: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Singleton instance of settings
def get_settings() -> Settings:
    """Get application settings"""
    try:
        return Settings()
    except Exception as e:
        raise ValueError(f"Failed to load settings: {str(e)}. Please check your .env file.")


# Export singleton
settings = get_settings()
