"""
Data Ingestion Service for SRO Complaints Chatbot
Handles CSV upload, JSONL conversion, and Vertex AI RAG Corpus creation
"""

import pandas as pd
import time
from typing import List, Dict, Any

from google.cloud import aiplatform
from vertexai.preview import rag

from ..config.settings import settings
from ..models.schemas import ComplaintRecord, ComplaintMetadata, ProcessingResult
from ..utils.logger import setup_logger
from ..utils.validators import validate_file_type, validate_complaint_data
from ..utils.exceptions import IngestionError, ValidationError
from .gcs_service import GCSService

logger = setup_logger(__name__)


class IngestionService:
    """Handles data ingestion pipeline for SRO complaint records using Vertex AI RAG"""

    def __init__(
        self,
        project_id: str = None,
        bucket_name: str = None,
        location: str = None
    ):
        """
        Initialize Ingestion Service

        Args:
            project_id: GCP project ID (uses settings if None)
            bucket_name: GCS bucket name (uses settings if None)
            location: GCP location (uses settings if None)
        """
        self.project_id = project_id or settings.gcp_project_id
        self.bucket_name = bucket_name or settings.gcs_bucket_name
        self.location = location or settings.vertex_ai_location
        self.duplicates_count = 0

        # Initialize GCS service
        self.gcs_service = GCSService(self.project_id, self.bucket_name)

        # Initialize Vertex AI
        try:
            aiplatform.init(
                project=self.project_id,
                location=self.location
            )
            logger.info(f"Initialized Vertex AI for project: {self.project_id}, location: {self.location}")
        except Exception as e:
            raise IngestionError(f"Failed to initialize Vertex AI: {str(e)}")

    def load_file(self, uploaded_file) -> pd.DataFrame:
        """
        Load CSV or Excel file into pandas DataFrame

        Args:
            uploaded_file: Streamlit uploaded file object

        Returns:
            pd.DataFrame: Loaded data

        Raises:
            ValidationError: If file type is not supported
            IngestionError: If file loading fails
        """
        try:
            # Validate file type
            validate_file_type(uploaded_file.name)

            file_extension = uploaded_file.name.split('.')[-1].lower()
            logger.info(f"Loading file: {uploaded_file.name} (type: {file_extension})")

            if file_extension == 'csv':
                df = pd.read_csv(uploaded_file)
            elif file_extension in ['xlsx', 'xls']:
                df = pd.read_excel(uploaded_file)
            else:
                raise ValidationError(f"Unsupported file format: {file_extension}")

            logger.info(f"Loaded {len(df)} rows from file")
            return df

        except ValidationError:
            raise
        except Exception as e:
            raise IngestionError(f"Failed to load file: {str(e)}")

    def remove_duplicates(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Remove duplicate complaints based on COMPLAINTNUMBER

        Args:
            df: DataFrame with complaint records

        Returns:
            pd.DataFrame: DataFrame with duplicates removed
        """
        initial_count = len(df)

        # Check if COMPLAINTNUMBER column exists
        if 'COMPLAINTNUMBER' in df.columns:
            df = df.drop_duplicates(subset=['COMPLAINTNUMBER'], keep='first')
            self.duplicates_count = initial_count - len(df)
            logger.info(f"Removed {self.duplicates_count} duplicates")
        else:
            logger.warning("COMPLAINTNUMBER column not found. Skipping duplicate removal.")
            self.duplicates_count = 0

        return df

    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean and standardize data

        Args:
            df: DataFrame with complaint records

        Returns:
            pd.DataFrame: Cleaned DataFrame
        """
        logger.info("Cleaning data...")

        # Convert date columns to datetime
        date_columns = ['CREATEDDATE']
        for col in date_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce')

        # Fill missing values with empty strings for text columns
        text_columns = [
            'NARRATIVE', 'UPDATEDNARRATIVE', 'Allegations',
            'REPORTINGAGENCY', 'OFFICERRANK', 'TITLE'
        ]
        for col in text_columns:
            if col in df.columns:
                df[col] = df[col].fillna('')

        logger.info("Data cleaning completed")
        return df

    def convert_to_jsonl(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Convert DataFrame to JSONL format for Vertex AI RAG

        Args:
            df: DataFrame with complaint records

        Returns:
            List[Dict]: List of JSON objects (one per complaint)
        """
        logger.info("Converting DataFrame to JSONL format...")
        jsonl_data = []

        for idx, row in df.iterrows():
            # Create content text for RAG indexing
            content_parts = []

            # Add complaint number
            if pd.notna(row.get('COMPLAINTNUMBER')):
                content_parts.append(f"Complaint Number: {row['COMPLAINTNUMBER']}")

            # Add date
            if pd.notna(row.get('CREATEDDATE')):
                content_parts.append(f"Date: {row['CREATEDDATE']}")

            # Add agency
            if pd.notna(row.get('REPORTINGAGENCY')) and row.get('REPORTINGAGENCY'):
                content_parts.append(f"Agency: {row['REPORTINGAGENCY']}")

            # Add officer information
            officer_info = []
            if pd.notna(row.get('OFFICERRANK')) and row.get('OFFICERRANK'):
                officer_info.append(f"Rank={row['OFFICERRANK']}")
            if pd.notna(row.get('GENDER')) and row.get('GENDER'):
                officer_info.append(f"Gender={row['GENDER']}")
            if pd.notna(row.get('RACE')) and row.get('RACE'):
                officer_info.append(f"Race={row['RACE']}")
            if officer_info:
                content_parts.append(f"Officer: {', '.join(officer_info)}")

            # Add allegations (truncate if too long)
            if pd.notna(row.get('Allegations')) and row.get('Allegations'):
                allegations = str(row['Allegations'])[:settings.max_allegations_length]
                content_parts.append(f"Allegations: {allegations}")

            # Add narrative (truncate for indexing efficiency)
            if pd.notna(row.get('NARRATIVE')) and row.get('NARRATIVE'):
                narrative = str(row['NARRATIVE'])[:settings.max_narrative_length]
                content_parts.append(f"Narrative: {narrative}")

            # Add updated narrative if different
            if pd.notna(row.get('UPDATEDNARRATIVE')) and row.get('UPDATEDNARRATIVE'):
                if row.get('UPDATEDNARRATIVE') != row.get('NARRATIVE'):
                    updated_narrative = str(row['UPDATEDNARRATIVE'])[:settings.max_narrative_length]
                    content_parts.append(f"Updated Narrative: {updated_narrative}")

            # Add dispositions
            if pd.notna(row.get('LEA Disposition (Allegations)')) and row.get('LEA Disposition (Allegations)'):
                content_parts.append(f"LEA Disposition: {row['LEA Disposition (Allegations)']}")

            if pd.notna(row.get('POSTC Disposition (Allegations)')) and row.get('POSTC Disposition (Allegations)'):
                content_parts.append(f"POST Disposition: {row['POSTC Disposition (Allegations)']}")

            # Add status
            if pd.notna(row.get('STATUS')) and row.get('STATUS'):
                content_parts.append(f"Status: {row['STATUS']}")

            # Add discipline
            if pd.notna(row.get('Discipline')) and row.get('Discipline'):
                content_parts.append(f"Discipline: {row['Discipline']}")

            # Combine all parts
            content = "\n".join(content_parts)

            # Create JSONL object
            jsonl_obj = {
                "id": f"complaint_{idx}",
                "content": content,
                "metadata": {
                    "complaint_number": str(row.get('COMPLAINTNUMBER', '')),
                    "agency": str(row.get('REPORTINGAGENCY', '')),
                    "date": str(row.get('CREATEDDATE', '')),
                    "status": str(row.get('STATUS', ''))
                }
            }

            jsonl_data.append(jsonl_obj)

        logger.info(f"Converted {len(jsonl_data)} records to JSONL format")
        return jsonl_data

    def create_or_get_corpus(
        self,
        corpus_display_name: str = None
    ) -> str:
        """
        Create a new RAG corpus or get existing one

        Args:
            corpus_display_name: Display name for the corpus (uses settings if None)

        Returns:
            str: Corpus resource name

        Raises:
            IngestionError: If corpus creation fails
        """
        corpus_display_name = corpus_display_name or settings.corpus_display_name

        try:
            # List existing corpora
            logger.info("Checking for existing RAG corpus...")
            corpora = rag.list_corpora()

            # Check if corpus already exists
            for corpus in corpora:
                if corpus.display_name == corpus_display_name:
                    logger.info(f"Found existing corpus: {corpus.name}")
                    return corpus.name

            # Create new corpus if not found
            logger.info(f"Creating new RAG corpus: {corpus_display_name}")
            corpus = rag.create_corpus(
                display_name=corpus_display_name,
                description="SRO complaints data from POST Commission"
            )

            logger.info(f"Created corpus: {corpus.name}")
            return corpus.name

        except Exception as e:
            raise IngestionError(f"Failed to create/get corpus: {str(e)}")

    def import_files_to_corpus(
        self,
        corpus_name: str,
        gcs_uri: str
    ) -> str:
        """
        Import JSONL file from GCS into RAG corpus

        Args:
            corpus_name: RAG corpus resource name
            gcs_uri: GCS URI of the JSONL file

        Returns:
            str: Import operation status

        Raises:
            IngestionError: If import fails
        """
        try:
            logger.info(f"Importing {gcs_uri} into corpus...")

            # Import files into corpus
            response = rag.import_files(
                corpus_name=corpus_name,
                paths=[gcs_uri],
                chunk_size=settings.chunk_size,
                chunk_overlap=settings.chunk_overlap
            )

            logger.info("Import initiated. Waiting for indexing to complete...")

            # Note: The import is async, indexing happens in background
            time.sleep(5)  # Give it a moment to start

            return "Import initiated successfully"

        except Exception as e:
            raise IngestionError(f"Failed to import files to corpus: {str(e)}")

    def process_file(self, uploaded_file) -> ProcessingResult:
        """
        Complete ingestion pipeline: CSV → JSONL → RAG Corpus

        Args:
            uploaded_file: Streamlit uploaded file object

        Returns:
            ProcessingResult: Processing results with metadata

        Raises:
            ValidationError: If validation fails
            IngestionError: If any processing step fails
        """
        try:
            # Step 1: Load file
            logger.info("Step 1: Loading file...")
            df = self.load_file(uploaded_file)

            # Step 2: Validate data
            logger.info("Step 2: Validating data...")
            validate_complaint_data(df)

            # Step 3: Remove duplicates
            logger.info("Step 3: Removing duplicates...")
            df = self.remove_duplicates(df)

            # Step 4: Clean data
            logger.info("Step 4: Cleaning data...")
            df = self.clean_data(df)

            # Step 5: Convert to JSONL
            logger.info("Step 5: Converting to JSONL...")
            jsonl_data = self.convert_to_jsonl(df)

            # Step 6: Upload JSONL to GCS
            logger.info("Step 6: Uploading JSONL to GCS...")
            timestamp = int(time.time())
            gcs_uri = self.gcs_service.upload_jsonl(
                jsonl_data,
                f"data/complaints_{timestamp}.jsonl"
            )

            # Step 7: Create/Get RAG Corpus
            logger.info("Step 7: Creating/Getting RAG Corpus...")
            corpus_name = self.create_or_get_corpus()

            # Step 8: Import files into RAG Corpus
            logger.info("Step 8: Importing files into RAG Corpus...")
            import_status = self.import_files_to_corpus(corpus_name, gcs_uri)

            logger.info("Processing complete!")

            # Return processing results
            return ProcessingResult(
                status="success",
                gcs_uri=gcs_uri,
                corpus_name=corpus_name,
                total_complaints=len(df),
                duplicates_removed=self.duplicates_count,
                import_status=import_status
            )

        except (ValidationError, IngestionError):
            raise
        except Exception as e:
            raise IngestionError(f"Unexpected error during file processing: {str(e)}")
