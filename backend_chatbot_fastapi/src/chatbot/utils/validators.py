"""
Validation Utilities for SRO Complaints Chatbot
"""

import pandas as pd
from typing import List, Optional
from .exceptions import ValidationError


# Required columns for complaint data
REQUIRED_COLUMNS = [
    'COMPLAINTNUMBER',
    'CREATEDDATE',
    'REPORTINGAGENCY',
    'NARRATIVE',
    'Allegations',
    'STATUS'
]

# Supported file extensions
SUPPORTED_FILE_TYPES = ['csv', 'xlsx', 'xls']


def validate_file_type(filename: str) -> bool:
    """
    Validate that file type is supported

    Args:
        filename: Name of the uploaded file

    Returns:
        bool: True if supported

    Raises:
        ValidationError: If file type is not supported
    """
    file_extension = filename.split('.')[-1].lower()

    if file_extension not in SUPPORTED_FILE_TYPES:
        raise ValidationError(
            f"Unsupported file type: {file_extension}. "
            f"Supported types: {', '.join(SUPPORTED_FILE_TYPES)}"
        )

    return True


def validate_required_columns(
    df: pd.DataFrame,
    required_columns: Optional[List[str]] = None
) -> bool:
    """
    Validate that DataFrame has required columns

    Args:
        df: DataFrame to validate
        required_columns: List of required column names (uses REQUIRED_COLUMNS if None)

    Returns:
        bool: True if all required columns are present

    Raises:
        ValidationError: If required columns are missing
    """
    if required_columns is None:
        required_columns = REQUIRED_COLUMNS

    missing_columns = [col for col in required_columns if col not in df.columns]

    if missing_columns:
        raise ValidationError(
            f"Missing required columns: {', '.join(missing_columns)}. "
            f"Please ensure your file has all required columns: {', '.join(required_columns)}"
        )

    return True


def validate_dataframe_not_empty(df: pd.DataFrame) -> bool:
    """
    Validate that DataFrame is not empty

    Args:
        df: DataFrame to validate

    Returns:
        bool: True if DataFrame has data

    Raises:
        ValidationError: If DataFrame is empty
    """
    if df.empty:
        raise ValidationError("File is empty. Please upload a file with complaint data.")

    return True


def validate_complaint_data(df: pd.DataFrame) -> bool:
    """
    Run all validation checks on complaint data

    Args:
        df: DataFrame with complaint data

    Returns:
        bool: True if all validations pass

    Raises:
        ValidationError: If any validation fails
    """
    validate_dataframe_not_empty(df)
    validate_required_columns(df)

    return True
