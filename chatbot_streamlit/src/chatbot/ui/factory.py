"""
Service Factory Module for SRO Complaints Chatbot
Provides cached service instances to avoid circular dependencies.
"""

import streamlit as st
from ..services.rag_service import RAGService
from ..services.ingestion_service import IngestionService


@st.cache_resource
def get_rag_service():
    """Create a singleton RAGService that persists across Streamlit reruns."""
    return RAGService()


@st.cache_resource
def get_ingestion_service():
    """Create a singleton IngestionService that persists across Streamlit reruns."""
    return IngestionService()
