# SRO Complaints Chatbot

A modular RAG-powered chatbot for analyzing POST Commission complaint records involving School Resource Officers (SROs).

## Project Structure

```
chatbot/
├── src/chatbot/              # Main application package
│   ├── config/              # Configuration management
│   │   └── settings.py      # Centralized settings (env vars)
│   ├── models/              # Data models
│   │   └── schemas.py       # Pydantic models for validation
│   ├── services/            # Business logic
│   │   ├── gcs_service.py   # Google Cloud Storage operations
│   │   ├── ingestion_service.py  # Data ingestion pipeline
│   │   └── rag_service.py   # RAG querying with Gemini
│   ├── ui/                  # User interface
│   │   ├── app.py          # Main Streamlit app
│   │   ├── pages/          # Page components
│   │   │   ├── chat.py     # Chat interface
│   │   │   └── ingestion.py # Data upload interface
│   │   └── components/     # Reusable UI components
│   │       ├── sidebar.py  # Sidebar
│   │       └── sources.py  # Source citations
│   └── utils/              # Utility modules
│       ├── exceptions.py   # Custom exceptions
│       ├── logger.py       # Logging configuration
│       └── validators.py   # Input validation
├── app.py                  # Entry point
├── requirements.txt        # Production dependencies
├── requirements-dev.txt    # Development dependencies
└── .env                    # Environment variables (not in git)
```

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

For development:
```bash
pip install -r requirements-dev.txt
```

### 2. Configure Environment

Create a `.env` file in the project root (copy from `.env.example`):

```bash
# GCP Configuration
GCP_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=your-bucket-name
LOCATION=us-east5

# Google AI API Key (for Gemini)
GOOGLE_API_KEY=your-api-key

# Gemini Model
GEMINI_MODEL=gemini-2.0-flash-lite
```

### 3. Run the Application

```bash
streamlit run app.py
```

The app will open in your browser at `http://localhost:8501`

## Usage

### 1. Upload Data

1. Go to the **Data Ingestion** tab
2. Upload a CSV or Excel file with complaint records
3. Click **Process File**
4. Wait for processing to complete

### 2. Ask Questions

1. Go to the **Chat** tab
2. Type your question in the text area
3. Click **Ask**
4. View the answer and sources

### Example Questions

- What is the demographic breakdown of youth in complaints?
- Which police departments have the most complaints?
- Is there a correlation between elementary school age and SRO complaints?
- Should SROs be placed in elementary schools based on this data?

## Architecture

### Config Module
- **Purpose**: Centralized configuration using Pydantic
- **Key Features**:
  - Environment variable validation
  - Type safety
  - Default values

### Services Layer
- **GCS Service**: Handles file uploads to Google Cloud Storage
- **Ingestion Service**: Processes CSV files and creates RAG corpus
- **RAG Service**: Queries Vertex AI RAG and generates answers with Gemini

### UI Layer
- **Modular Design**: Separate components and pages
- **Reusable Components**: Sidebar, sources display
- **Clean Separation**: UI logic separate from business logic

### Data Models
- **Pydantic Models**: Type-safe data validation
- **Schemas**: ComplaintRecord, ProcessingResult, RAGQueryResponse, Source

## Development

### Running Tests

```bash
pytest tests/
```

### Code Formatting

```bash
black src/
```

### Linting

```bash
ruff check src/
```

### Type Checking

```bash
mypy src/
```

## Key Improvements Over Previous Structure

1. **Separation of Concerns**: Config, models, services, and UI are clearly separated
2. **Type Safety**: Pydantic models provide automatic validation
3. **Better Error Handling**: Custom exceptions and proper logging
4. **Testability**: Services can be tested independently
5. **Maintainability**: Smaller, focused modules
6. **Scalability**: Easy to add new features
7. **Production Ready**: Proper logging, configuration, and error handling

## Client Information

- **Client**: Citizens for Juvenile Justice (CFJJ)
- **Contact**: Josh Dankoff (joshuadankoff@cfjj.org)
- **Data Source**: Massachusetts POST Commission PRR Dataset
- **Purpose**: Analyze patterns in SRO complaints involving youth under 18

## License

Built for SPARK-CDS-DD4G Program | Boston University | Spring 2026
