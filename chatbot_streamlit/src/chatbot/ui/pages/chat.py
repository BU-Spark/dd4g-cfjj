"""
Chat Page for SRO Complaints Chatbot
"""

import streamlit as st
from ...config.settings import settings
from ...services.rag_service import RAGService
from ...utils.exceptions import RAGError
from ..components.sources import render_sources


def render_chat_page():
    """Render the chat interface page"""

    st.header("Ask Questions About SRO Complaints")

    # Example questions in an expander
    with st.expander("📋 Example Questions"):
        st.markdown("""
        **Demographics:**
        - What is the demographic breakdown of youth in complaints?
        - What patterns exist in complaints involving youth under age 12?

        **Geographic Analysis:**
        - Which police departments have the most complaints?
        - What are the geographic patterns in complaint distribution?

        **Correlation Analysis:**
        - Is there a correlation between elementary school age and SRO complaints?
        - Are certain types of allegations more common with specific demographics?

        **Policy Questions:**
        - Should SROs be placed in elementary schools based on this data?
        - What do the complaint patterns suggest about SRO effectiveness?

        **Complaint Types:**
        - What are the most common types of allegations?
        - How are complaints typically resolved?
        """)

    # Chat interface
    question = st.text_area(
        "Your question:",
        placeholder="Ask about demographics, patterns, correlations, or policy recommendations...",
        height=100,
        key="question_input"
    )

    # Check if data is loaded
    data_loaded = st.session_state.get('corpus_ready', False)

    # Action buttons
    col1, col2, col3 = st.columns([1, 1, 4])
    with col1:
        ask_button = st.button("🔍 Ask", type="primary", use_container_width=True)
    with col2:
        clear_button = st.button("🗑️ Clear", use_container_width=True)

    # Handle clear button
    if clear_button:
        st.session_state.pop('question_input', None)
        st.session_state.pop('last_answer', None)
        st.rerun()

    # Handle ask button
    if ask_button and question:
        if not data_loaded:
            st.error("❌ No data loaded. Please upload complaint data in the **Data Ingestion** tab first.")
        elif not settings.gcp_project_id:
            st.error("❌ GCP_PROJECT_ID environment variable not set. Please configure your environment.")
        else:
            with st.spinner("🔎 Analyzing complaints..."):
                try:
                    # Get corpus name from session state
                    corpus_name = st.session_state.get('corpus_name')

                    if not corpus_name:
                        st.error("❌ RAG corpus not found. Please re-upload your data.")
                    else:
                        # Initialize RAG service
                        rag_service = RAGService()

                        # Query the RAG corpus
                        result = rag_service.query(corpus_name, question)

                        # Store in session state
                        st.session_state.last_answer = result

                        # Display answer
                        st.markdown("### 💡 Answer")
                        st.markdown(result.answer)

                        # Display reasoning
                        if result.reasoning:
                            with st.expander("🧠 Methodology"):
                                st.info(result.reasoning)

                        # Display sources
                        render_sources(result.sources, result.num_sources)

                        st.success("✅ Analysis complete!")

                except RAGError as e:
                    st.error(f"❌ RAG Error: {str(e)}")
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")
                    st.exception(e)

    # Show last answer if available
    if 'last_answer' in st.session_state and not ask_button:
        result = st.session_state.last_answer

        st.markdown("### 💡 Answer")
        st.markdown(result.answer)

        if result.reasoning:
            with st.expander("🧠 Methodology"):
                st.info(result.reasoning)

        render_sources(result.sources, result.num_sources)
