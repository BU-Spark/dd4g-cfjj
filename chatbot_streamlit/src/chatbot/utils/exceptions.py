"""
Custom Exceptions for SRO Complaints Chatbot
"""


class ChatbotException(Exception):
    """Base exception for chatbot errors"""
    pass


class ConfigError(ChatbotException):
    """Configuration or environment variable error"""
    pass


class IngestionError(ChatbotException):
    """Data ingestion pipeline error"""
    pass


class RAGError(ChatbotException):
    """RAG query or retrieval error"""
    pass


class ValidationError(ChatbotException):
    """Data validation error"""
    pass


class GCSError(ChatbotException):
    """Google Cloud Storage error"""
    pass
