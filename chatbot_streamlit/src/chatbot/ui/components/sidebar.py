"""
Sidebar Component for SRO Complaints Chatbot
"""

import streamlit as st
from ...config.settings import settings


def render_sidebar():
    """Render the sidebar with project info and configuration status"""

    st.markdown("# 🔍 SRO Complaints")
    st.markdown("### Analysis Tool")
    st.markdown("---")

    # About section
    st.markdown("""
    **About**

    Query POST Commission complaint records involving School Resource Officers (SROs) and patrol officers with youth under 18.

    **Client**: Citizens for Juvenile Justice (CFJJ)

    **Data Source**: Massachusetts POST Commission PRR Dataset
    """)

    st.markdown("---")

    # Configuration status
    st.markdown("### Configuration")

    # Project ID
    if settings.gcp_project_id:
        st.success(f"✓ Project: {settings.gcp_project_id}")
    else:
        st.error("✗ GCP_PROJECT_ID not set")

    # Bucket Name
    if settings.gcs_bucket_name:
        st.success(f"✓ Bucket: {settings.gcs_bucket_name}")
    else:
        st.warning("⚠ Using default bucket name")

    st.markdown("---")

    # Corpus status
    if 'corpus_ready' in st.session_state and st.session_state.corpus_ready:
        st.success("✓ RAG Corpus Ready")
        st.info(f"Complaints loaded: {st.session_state.get('total_complaints', 0)}")
    else:
        st.warning("⚠ No data loaded")
        st.info("Upload data in the Ingestion tab")
