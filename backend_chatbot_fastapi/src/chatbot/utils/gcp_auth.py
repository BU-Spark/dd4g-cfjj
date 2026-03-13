"""
GCP Authentication Helper
Handles credentials from environment variables or default credentials
"""

import os
import json
import tempfile
from google.oauth2 import service_account
from typing import Optional

from .logger import setup_logger

logger = setup_logger(__name__)


def get_gcp_credentials():
    """
    Get GCP credentials from environment variable or use default credentials

    Returns:
        Credentials object or None (to use default credentials)
    """
    # Check if GOOGLE_CREDENTIALS_JSON env var is set (for Railway)
    credentials_json = os.getenv('GOOGLE_CREDENTIALS_JSON')

    if credentials_json:
        logger.info("Using credentials from GOOGLE_CREDENTIALS_JSON environment variable")
        try:
            # Parse JSON from environment variable
            credentials_info = json.loads(credentials_json)
            credentials = service_account.Credentials.from_service_account_info(credentials_info)
            return credentials
        except Exception as e:
            logger.error(f"Failed to load credentials from GOOGLE_CREDENTIALS_JSON: {e}")
            raise ValueError(f"Invalid GOOGLE_CREDENTIALS_JSON: {str(e)}")

    # Check if GOOGLE_APPLICATION_CREDENTIALS file path is set
    credentials_file = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')

    if credentials_file:
        logger.info(f"Using credentials from file: {credentials_file}")
        try:
            credentials = service_account.Credentials.from_service_account_file(credentials_file)
            return credentials
        except Exception as e:
            logger.error(f"Failed to load credentials from file {credentials_file}: {e}")
            raise ValueError(f"Invalid credentials file: {str(e)}")

    # Use default credentials (local gcloud auth)
    logger.info("Using default application credentials (gcloud auth)")
    return None  # Let Google libraries use default credentials


def get_credentials_project_id() -> Optional[str]:
    """
    Extract project ID from credentials if available

    Returns:
        Project ID from credentials or None
    """
    credentials_json = os.getenv('GOOGLE_CREDENTIALS_JSON')

    if credentials_json:
        try:
            credentials_info = json.loads(credentials_json)
            return credentials_info.get('project_id')
        except Exception:
            pass

    credentials_file = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')

    if credentials_file:
        try:
            with open(credentials_file, 'r') as f:
                credentials_info = json.load(f)
                return credentials_info.get('project_id')
        except Exception:
            pass

    return None
