"""
RAG Service Module for SRO Complaints Chatbot
Handles querying using Vertex AI RAG and Gemini
"""

from typing import List, Dict, Any
from google.cloud import aiplatform
from vertexai.preview import rag
import google.generativeai as genai

from ..config.settings import settings
from ..models.schemas import RAGQueryResponse, Source
from ..utils.logger import setup_logger
from ..utils.exceptions import RAGError

logger = setup_logger(__name__)


class RAGService:
    """RAG service for querying Vertex AI RAG corpus"""

    def __init__(
        self,
        project_id: str = None,
        location: str = None,
        model_name: str = None
    ):
        """
        Initialize RAG Service

        Args:
            project_id: GCP project ID (uses settings if None)
            location: GCP location (uses settings if None)
            model_name: Gemini model name (uses settings if None)
        """
        self.project_id = project_id or settings.gcp_project_id
        self.location = location or settings.vertex_ai_location
        self.model_name = model_name or settings.gemini_model

        try:
            # Initialize Vertex AI
            aiplatform.init(project=self.project_id, location=self.location)
            logger.info(f"Initialized Vertex AI for project: {self.project_id}, location: {self.location}")

            # Initialize Gemini with API key
            api_key = settings.google_api_key
            if not api_key:
                raise RAGError("GOOGLE_API_KEY not set. Please configure your .env file.")

            genai.configure(api_key=api_key)
            self.llm = genai.GenerativeModel(self.model_name)
            logger.info(f"Initialized Gemini model: {self.model_name}")

        except Exception as e:
            raise RAGError(f"Failed to initialize RAG service: {str(e)}")

    def retrieve_relevant_docs(
        self,
        corpus_name: str,
        query: str,
        top_k: int = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant documents from Vertex AI RAG corpus

        Args:
            corpus_name: RAG corpus resource name
            query: User's question
            top_k: Number of documents to retrieve (uses settings if None)

        Returns:
            List[Dict]: Retrieved documents with metadata

        Raises:
            RAGError: If retrieval fails
        """
        top_k = top_k or settings.similarity_top_k

        try:
            logger.info(f"Retrieving top-{top_k} documents for query: {query[:100]}...")

            # Use Vertex AI RAG retrieval
            response = rag.retrieval_query(
                rag_resources=[
                    rag.RagResource(
                        rag_corpus=corpus_name,
                    )
                ],
                text=query,
                similarity_top_k=top_k,
            )

            # Extract relevant contexts
            relevant_docs = []

            if hasattr(response, 'contexts') and response.contexts:
                for i, context in enumerate(response.contexts.contexts[:top_k]):
                    doc = {
                        'content': context.text if hasattr(context, 'text') else str(context),
                        'source': context.source_uri if hasattr(context, 'source_uri') else 'Unknown',
                        'similarity_score': context.distance if hasattr(context, 'distance') else 0.0,
                        'rank': i + 1
                    }
                    relevant_docs.append(doc)

            logger.info(f"Retrieved {len(relevant_docs)} relevant documents")
            return relevant_docs

        except Exception as e:
            raise RAGError(f"Failed to retrieve documents: {str(e)}")

    def build_context(self, relevant_docs: List[Dict[str, Any]]) -> str:
        """
        Build context string from retrieved documents

        Args:
            relevant_docs: List of retrieved documents

        Returns:
            str: Formatted context for LLM
        """
        if not relevant_docs:
            logger.warning("No relevant documents found")
            return "No relevant documents found."

        context_parts = []

        for i, doc in enumerate(relevant_docs, 1):
            context_parts.append(f"--- Document {i} ---")
            context_parts.append(f"Relevance Score: {doc.get('similarity_score', 0.0):.3f}")
            context_parts.append(f"\n{doc['content']}\n")

        context = "\n".join(context_parts)
        logger.info(f"Built context with {len(relevant_docs)} documents ({len(context)} characters)")

        return context

    def generate_answer(self, question: str, context: str) -> Dict[str, Any]:
        """
        Generate answer using Gemini with retrieved context

        Args:
            question: User's question
            context: Retrieved documents context

        Returns:
            Dict: Answer with reasoning

        Raises:
            RAGError: If answer generation fails
        """
        prompt = f"""You are an expert analyst of School Resource Officer (SRO) complaint data from the Massachusetts POST Commission.

Question: {question}

Relevant Complaint Records:
{context}

Provide a comprehensive answer that:
1. Directly answers the question based on the complaint data provided
2. Cites specific details from the complaints
3. Identifies patterns in demographics (age, race, gender) if relevant
4. Explains your reasoning and methodology
5. For policy questions, provide data-driven recommendations while acknowledging limitations
6. Notes any gaps or missing information in the data

Important Guidelines:
- Only use information from the provided complaint records
- Be precise with numbers and statistics
- Acknowledge when data is insufficient for definitive conclusions
- Distinguish between correlation and causation
- Consider that complaint data reflects only reported incidents, not all incidents
- Maintain objectivity and avoid bias

Answer:"""

        try:
            logger.info("Generating answer with Gemini...")

            # Generate response using Gemini
            response = self.llm.generate_content(prompt)

            logger.info("Successfully generated answer")

            return {
                "answer": response.text,
                "reasoning": "Answer based on Vertex AI RAG retrieval and Gemini analysis"
            }

        except Exception as e:
            raise RAGError(f"Failed to generate answer: {str(e)}")

    def format_sources(self, relevant_docs: List[Dict[str, Any]]) -> List[Source]:
        """
        Format sources for display

        Args:
            relevant_docs: List of retrieved documents

        Returns:
            List[Source]: Formatted source citations
        """
        sources = []

        for i, doc in enumerate(relevant_docs, 1):
            # Extract complaint number from content if available
            content = doc['content']
            complaint_number = "N/A"
            agency = "N/A"

            # Try to extract metadata from content
            if "Complaint Number:" in content:
                lines = content.split('\n')
                for line in lines:
                    if "Complaint Number:" in line:
                        complaint_number = line.replace("Complaint Number:", "").strip()
                    elif "Agency:" in line:
                        agency = line.replace("Agency:", "").strip()

            source = Source(
                rank=i,
                complaint_number=complaint_number,
                agency=agency,
                similarity_score=f"{doc.get('similarity_score', 0.0):.3f}",
                preview=content[:200] + "..." if len(content) > 200 else content
            )

            sources.append(source)

        logger.info(f"Formatted {len(sources)} sources")
        return sources

    def query(
        self,
        corpus_name: str,
        question: str,
        top_k: int = None
    ) -> RAGQueryResponse:
        """
        Complete RAG pipeline: retrieve documents and generate answer

        Args:
            corpus_name: RAG corpus resource name
            question: User's question
            top_k: Number of documents to retrieve (uses settings if None)

        Returns:
            RAGQueryResponse: Answer, reasoning, and sources

        Raises:
            RAGError: If any step fails
        """
        try:
            logger.info(f"Processing RAG query: {question[:100]}...")

            # Retrieve relevant documents from RAG corpus
            relevant_docs = self.retrieve_relevant_docs(corpus_name, question, top_k)

            # Build context from retrieved documents
            context = self.build_context(relevant_docs)

            # Generate answer using Gemini
            answer_data = self.generate_answer(question, context)

            # Format sources for display
            sources = self.format_sources(relevant_docs)

            logger.info("RAG query completed successfully")

            return RAGQueryResponse(
                answer=answer_data["answer"],
                reasoning=answer_data["reasoning"],
                sources=sources,
                num_sources=len(sources)
            )

        except RAGError:
            raise
        except Exception as e:
            raise RAGError(f"Unexpected error during RAG query: {str(e)}")
