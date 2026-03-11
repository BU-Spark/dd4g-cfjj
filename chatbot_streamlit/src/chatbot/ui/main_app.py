"""
SRO Complaints Chatbot - Main Streamlit Application
Interactive chatbot for querying POST Commission complaint records
"""

import streamlit as st
from .components.sidebar import render_sidebar
from .pages.chat import render_chat_page
from .pages.ingestion import render_ingestion_page
from .factory import get_rag_service, get_ingestion_service


# Page configuration
st.set_page_config(
    page_title="SRO Complaints Chatbot",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
    <style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
    }
    .sub-header {
        font-size: 1.2rem;
        color: #666;
    }
    .source-box {
        background-color: #f0f2f6;
        padding: 15px;
        border-radius: 5px;
        margin: 10px 0;
    }
    </style>
""", unsafe_allow_html=True)



def main():
    """Main application entry point"""

    # Render sidebar
    with st.sidebar:
        render_sidebar()

    # Auto-initialize corpus if not already set
    if 'corpus_ready' not in st.session_state:
        st.session_state.corpus_ready = False

    if not st.session_state.get('corpus_ready', False):
        with st.spinner("Checking for existing knowledge base..."):
            try:
                rag_service = get_rag_service()
                corpus_name = rag_service.discover_corpus()
                if corpus_name:
                    st.session_state.corpus_ready = True
                    st.session_state.corpus_name = corpus_name
                    # We don't have total_complaints count yet, but it's optional for the UI
            except Exception:
                # Silently fail auto-discovery, user can still manual upload
                pass

    # Main title
    st.markdown('<p class="main-header">SRO Complaints Chatbot</p>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header">Query and analyze POST Commission complaint records</p>', unsafe_allow_html=True)

    # Main tabs
    tab1, tab2 = st.tabs(["💬 Chat", "📁 Data Ingestion"])

    # Render pages
    with tab1:
        render_chat_page()

    with tab2:
        render_ingestion_page()

    # Footer
    st.markdown("---")
    st.markdown("""
    <div style='text-align: center; color: #666; font-size: 0.9rem;'>
        <p>SRO Complaints Chatbot | Citizens for Juvenile Justice (CFJJ)</p>
        <p>Built for analyzing POST Commission complaint records | Spring 2026</p>
    </div>
    """, unsafe_allow_html=True)


if __name__ == "__main__":
    main()
