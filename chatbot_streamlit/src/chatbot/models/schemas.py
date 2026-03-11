"""
Data Models and Schemas for SRO Complaints Chatbot
Pydantic models for type safety and validation
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class ComplaintMetadata(BaseModel):
    """Metadata for a complaint record"""
    complaint_number: str
    agency: str
    date: str
    status: str


class ComplaintRecord(BaseModel):
    """A single complaint record from POST Commission data"""
    id: str
    content: str
    metadata: ComplaintMetadata


class ProcessingResult(BaseModel):
    """Result of data ingestion processing"""
    status: str = "success"
    gcs_uri: str
    corpus_name: str
    total_complaints: int
    duplicates_removed: int
    import_status: str = "Import initiated successfully"
    embeddings_generated: Optional[int] = None

    def dict(self, *args, **kwargs):
        """Override dict to include embeddings_generated with fallback"""
        data = super().dict(*args, **kwargs)
        if data['embeddings_generated'] is None:
            data['embeddings_generated'] = data['total_complaints']
        return data


class Source(BaseModel):
    """Citation source for RAG response"""
    rank: int
    complaint_number: str
    agency: str
    similarity_score: str
    preview: str


class RAGQueryRequest(BaseModel):
    """Request for RAG query"""
    corpus_name: str
    question: str
    top_k: int = Field(default=5, ge=1, le=20)


class RAGQueryResponse(BaseModel):
    """Response from RAG query"""
    answer: str
    reasoning: str
    sources: List[Source]
    num_sources: int

    class Config:
        arbitrary_types_allowed = True


class FileUpload(BaseModel):
    """File upload metadata"""
    filename: str
    file_size: int
    file_type: str

    @property
    def file_extension(self) -> str:
        """Get file extension"""
        return self.filename.split('.')[-1].lower()

    @property
    def is_valid_type(self) -> bool:
        """Check if file type is valid"""
        return self.file_extension in ['csv', 'xlsx', 'xls']
