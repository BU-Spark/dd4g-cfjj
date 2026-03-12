"""
Google Cloud Storage Service for SRO Complaints Chatbot
Handles file upload and management in GCS
"""

import json
from typing import List, Dict, Any
from google.cloud import storage

from ..config.settings import settings
from ..utils.logger import setup_logger
from ..utils.exceptions import GCSError
from ..utils.gcp_auth import get_gcp_credentials

logger = setup_logger(__name__)


class GCSService:
    """Service for Google Cloud Storage operations"""

    def __init__(self, project_id: str = None, bucket_name: str = None):
        """
        Initialize GCS Service

        Args:
            project_id: GCP project ID (uses settings if None)
            bucket_name: GCS bucket name (uses settings if None)
        """
        self.project_id = project_id or settings.gcp_project_id
        self.bucket_name = bucket_name or settings.gcs_bucket_name

        try:
            credentials = get_gcp_credentials()
            if credentials:
                self.client = storage.Client(project=self.project_id, credentials=credentials)
            else:
                self.client = storage.Client(project=self.project_id)
            logger.info(f"Initialized GCS client for project: {self.project_id}")
        except Exception as e:
            raise GCSError(f"Failed to initialize GCS client: {str(e)}")

    def upload_jsonl(
        self,
        jsonl_data: List[Dict[str, Any]],
        destination_path: str,
        content_type: str = 'application/jsonl'
    ) -> str:
        """
        Upload JSONL data to GCS

        Args:
            jsonl_data: List of JSON objects
            destination_path: Destination path in bucket (e.g., 'data/complaints.jsonl')
            content_type: Content type for the blob

        Returns:
            str: GCS URI (gs://bucket/path)

        Raises:
            GCSError: If upload fails
        """
        try:
            logger.info(f"Uploading JSONL to gs://{self.bucket_name}/{destination_path}")

            bucket = self.client.bucket(self.bucket_name)
            blob = bucket.blob(destination_path)

            # Convert to JSONL format (one JSON object per line)
            jsonl_content = "\n".join([json.dumps(obj) for obj in jsonl_data])

            # Upload to GCS
            blob.upload_from_string(jsonl_content, content_type=content_type)

            gcs_uri = f"gs://{self.bucket_name}/{destination_path}"
            logger.info(f"Successfully uploaded to {gcs_uri}")

            return gcs_uri

        except Exception as e:
            raise GCSError(f"Failed to upload JSONL to GCS: {str(e)}")

    def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from GCS

        Args:
            file_path: Path to file in bucket

        Returns:
            bool: True if deletion successful

        Raises:
            GCSError: If deletion fails
        """
        try:
            logger.info(f"Deleting file: gs://{self.bucket_name}/{file_path}")

            bucket = self.client.bucket(self.bucket_name)
            blob = bucket.blob(file_path)
            blob.delete()

            logger.info(f"Successfully deleted {file_path}")
            return True

        except Exception as e:
            raise GCSError(f"Failed to delete file from GCS: {str(e)}")

    def list_files(self, prefix: str = None) -> List[str]:
        """
        List files in GCS bucket

        Args:
            prefix: Prefix to filter files (optional)

        Returns:
            List[str]: List of file paths

        Raises:
            GCSError: If listing fails
        """
        try:
            logger.info(f"Listing files in gs://{self.bucket_name}/{prefix or ''}")

            bucket = self.client.bucket(self.bucket_name)
            blobs = bucket.list_blobs(prefix=prefix)

            file_paths = [blob.name for blob in blobs]
            logger.info(f"Found {len(file_paths)} files")

            return file_paths

        except Exception as e:
            raise GCSError(f"Failed to list files from GCS: {str(e)}")
