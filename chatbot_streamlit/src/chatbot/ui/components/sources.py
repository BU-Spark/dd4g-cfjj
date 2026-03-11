"""
Sources Display Component for SRO Complaints Chatbot
"""

import streamlit as st
from typing import List
from ...models.schemas import Source


def render_sources(sources: List[Source], num_sources: int):
    """
    Render sources with expandable details

    Args:
        sources: List of Source objects
        num_sources: Total number of sources
    """
    st.markdown("### 📚 Sources")
    st.caption(f"Based on {num_sources} most relevant complaint records")

    for source in sources:
        with st.expander(
            f"📄 Source {source.rank}: Complaint {source.complaint_number} - {source.agency}"
        ):
            col1, col2 = st.columns(2)

            with col1:
                st.markdown(f"**Complaint Number:** {source.complaint_number}")
                st.markdown(f"**Agency:** {source.agency}")

            with col2:
                st.markdown(f"**Similarity Score:** {source.similarity_score}")

            st.markdown("**Preview:**")
            st.text(source.preview)
