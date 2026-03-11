"""
Data Ingestion Page for SRO Complaints Chatbot
"""

import streamlit as st
from ...config.settings import settings
from ...services.ingestion_service import IngestionService
from ...utils.exceptions import IngestionError, ValidationError
from ..factory import get_ingestion_service



def render_ingestion_page():
    """Render the data ingestion interface page"""

    st.header("📁 Upload & Process Complaint Data")

    st.markdown("""
    Upload a CSV or Excel file containing POST Commission complaint records.

    **Required columns:**
    - `COMPLAINTNUMBER` - Unique identifier for each complaint
    - `CREATEDDATE` - Date the complaint was created
    - `REPORTINGAGENCY` - Police department name
    - `NARRATIVE` - Description of the complaint
    - `Allegations` - Type of allegations
    - `STATUS` - Current status of the complaint

    The system will automatically:
    - Remove duplicate complaints (by complaint number)
    - Generate embeddings for semantic search
    - Create a searchable knowledge base
    """)

    st.markdown("---")

    # File uploader
    uploaded_file = st.file_uploader(
        "Choose a file",
        type=["csv", "xlsx", "xls"],
        help="Upload CSV or Excel file with complaint records",
        key="file_uploader"
    )

    if uploaded_file:
        st.success(f"✅ File uploaded: **{uploaded_file.name}**")
        st.info(f"File size: {uploaded_file.size / 1024:.2f} KB")

        st.markdown("---")

        if st.button("🚀 Process File", type="primary", use_container_width=True):
            if not settings.gcp_project_id:
                st.error("❌ GCP_PROJECT_ID environment variable not set. Please configure your environment.")
            else:
                with st.spinner("Processing file..."):
                    try:
                        # Get cached ingestion service (singleton across reruns)
                        ingestion_service = get_ingestion_service()

                        # Progress tracking
                        progress_bar = st.progress(0, text="Starting...")
                        status_text = st.empty()

                        # Process file with progress updates
                        status_text.info("📥 Loading file...")
                        progress_bar.progress(10, text="Loading file...")

                        status_text.info("🧹 Removing duplicates and cleaning data...")
                        progress_bar.progress(30, text="Cleaning data...")

                        status_text.info("☁️ Uploading to Google Cloud Storage...")
                        progress_bar.progress(50, text="Uploading to GCS...")

                        status_text.info("🤖 Generating embeddings (this may take a few minutes)...")
                        progress_bar.progress(70, text="Generating embeddings...")

                        # Process the file
                        result = ingestion_service.process_file(uploaded_file)

                        progress_bar.progress(100, text="Complete!")
                        status_text.success("✅ Processing complete!")

                        # Save to session state
                        st.session_state.corpus_ready = True
                        st.session_state.corpus_name = result.corpus_name
                        st.session_state.total_complaints = result.total_complaints

                        # Display results
                        st.markdown("---")
                        st.success("🎉 File processed successfully!")

                        # Metrics
                        col1, col2, col3 = st.columns(3)
                        with col1:
                            st.metric(
                                "📊 Total Complaints",
                                result.total_complaints,
                                help="Number of complaints in the dataset"
                            )
                        with col2:
                            st.metric(
                                "🗑️ Duplicates Removed",
                                result.duplicates_removed,
                                help="Number of duplicate complaints removed"
                            )
                        with col3:
                            embeddings = result.embeddings_generated or result.total_complaints
                            st.metric(
                                "🧠 Embeddings Generated",
                                embeddings,
                                help="Number of embedding vectors created"
                            )

                        # File paths
                        st.markdown("**📁 Data Location:**")
                        st.code(result.gcs_uri, language="text")

                        st.markdown("**🧠 RAG Corpus:**")
                        st.code(result.corpus_name, language="text")

                        st.markdown("---")
                        st.success("✅ **Ready!** Go to the **Chat** tab to ask questions!")

                        # Refresh UI to update sidebar status
                        st.rerun()

                    except ValidationError as e:
                        st.error(f"❌ Validation Error: {str(e)}")
                    except IngestionError as e:
                        st.error(f"❌ Ingestion Error: {str(e)}")
                    except Exception as e:
                        st.error(f"❌ Error processing file: {str(e)}")
                        st.exception(e)
    else:
        st.info("👆 Please upload a CSV or Excel file to begin")
