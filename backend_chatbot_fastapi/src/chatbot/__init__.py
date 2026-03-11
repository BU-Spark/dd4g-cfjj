"""
SRO Complaints Chatbot
A modular RAG-powered chatbot for analyzing POST Commission complaint records
"""

__version__ = "1.0.0"

from .config.settings import settings
from .services.ingestion_service import IngestionService
from .services.rag_service import RAGService
from .services.gcs_service import GCSService

__all__ = [
    "settings",
    "IngestionService",
    "RAGService",
    "GCSService",
]
