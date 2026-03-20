<h1 align="center">                                                                               
    <br>                                                                                            
    <a href="https://www.bu.edu/spark/" target="_blank"><img                                        
  src="https://www.bu.edu/spark/files/2023/08/logo.png" alt="BUSpark" width="200"></a>              
    <br>                                                                                            
    SRO Complaints Analysis Platform
    <br>
  </h1>

  <h4 align="center">An AI-powered RAG chatbot for analyzing School Resource Officer complaint data
  for Citizens for Juvenile Justice.</h4>

  <p align="center">
    <a href="#key-features">Key Features</a> •
    <a href="#how-to-use">How To Use</a> •
    <a href="#project-description">Project Description</a> •
    <a href="#data-locations">Data Locations</a>
  </p>

  ## Key Features

  * `/frontend` - React 19 + Vite web application
    - Chat interface for querying SRO complaint data in natural language
    - Knowledge Base page for admins to upload and manage datasets
    - Role-based access control via Clerk (admin vs. standard user)
    - Persistent chat history with create/load/delete functionality

  * `/backend_chatbot_fastapi` - Primary Python FastAPI backend
    - `POST /ingest` — Upload CSV/Excel complaint data; auto-cleans, deduplicates, and indexes into
  Vertex AI RAG corpus
    - `POST /query` — Natural language querying powered by Gemini + Vertex AI RAG Engine with cited
  sources
    - In-memory caching and rate limiting to reduce API calls by ~90%

  * `/backend` - Legacy Express.js backend (Node.js)
    - MongoDB-backed chat persistence with protected CRUD routes
    - GCS file proxy for downloads
    - Clerk authentication middleware

  * `/data_analysis/scripts` - Exploratory data analysis notebooks
    - EDA on POST Commission complaint data and DESE datasets
    - Demographic breakdowns, complaint trends, and school-level analysis

  ## How To Use

  To clone and run this application, you'll need <a href="https://git-scm.com" 
  target="_blank">Git</a>, Node.js, and Python 3.9+.

  ```bash
  # Clone this repository
  $ git clone https://github.com/BU-Spark/dd4g-cfjj.git

  # Install frontend dependencies
  $ cd frontend && npm install

  # Install FastAPI backend dependencies
  $ cd ../backend_chatbot_fastapi && pip install -r requirements.txt

  # Install Express backend dependencies
  $ cd ../backend && npm install

  Set up environment variables:

  # backend_chatbot_fastapi/.env
  GCP_PROJECT_ID=dd4g-cfjj-chatbot
  GCS_BUCKET_NAME=sro-complaints-data-dd4g-cfjj-chatbot
  LOCATION=us-east5
  GOOGLE_API_KEY=<your Gemini API key>
  GEMINI_MODEL=gemini-2.5-flash
  GOOGLE_APPLICATION_CREDENTIALS=<path to GCP service account JSON>

  # backend/.env
  CLERK_SECRET_KEY=sk_...
  MONGODB_URI=mongodb+srv://...
  PORT=3001

  # frontend/.env
  VITE_CLERK_PUBLISHABLE_KEY=pk_...
  VITE_API_URL=http://localhost:3001

  Run all three services:

  # Terminal 1 — FastAPI backend
  $ cd backend_chatbot_fastapi && uvicorn backend:app --reload --port 8000

  # Terminal 2 — Express backend
  $ cd backend && npm run dev

  # Terminal 3 — Frontend
  $ cd frontend && npm run dev

  Create a new branch from main, add changes on the new branch you just created.

  $ git checkout -b your-branch main

  Open a Pull Request to main. Add your PM and TPM as reviewers.

  Project Description

  This project was built for Citizens for Juvenile Justice (CFJJ) through the BU Spark! × MassMutual
   Data-Driven for Good program (Spring 2026).

  - CFJJ advocates for juvenile justice reform in Massachusetts and needed a way to analyze School
  Resource Officer (SRO) complaint data from the POST Commission — a dataset covering complaints
  involving youth under 18. The goal was to make this data accessible to non-technical staff without
   requiring SQL queries or manual spreadsheet analysis.
  - The platform allows CFJJ staff to upload complaint datasets (CSV/Excel) and query them
  conversationally through an AI chatbot. All answers are grounded exclusively in the uploaded data,
   with cited sources and similarity scores, ensuring accuracy and traceability. Admins can
  continuously update the knowledge base with new data, and the chatbot automatically reflects the
  latest uploads.

  Data Locations

  Dataset Documentation

  - dataset-documentation/ — Data dictionary and dataset documentation
    - Covers POST Commission complaint data and DESE datasets
  - Google Cloud Storage: gs://sro-complaints-data-dd4g-cfjj-chatbot/
    - Processed JSONL complaint files uploaded by admins and indexed into Vertex AI RAG corpus
  - data_analysis/scripts/ — Raw EDA notebooks
    - EDA-POSTC-request.ipynb — POST Commission complaint analysis
    - EDA-DESE.ipynb — DESE school data analysis
    - Combined_Analysis.ipynb — Combined demographic and complaint trends

