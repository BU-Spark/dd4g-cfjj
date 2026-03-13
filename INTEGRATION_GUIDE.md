# Frontend-Backend Integration Guide

## Simple 3-Step Setup

### Step 1: Deploy Backend to Railway

1. **Push your code to GitHub**
   ```bash
   cd /Users/wasamchaudhry/Study/mass_mutual/cfjj/dd4g-cfjj
   git add .
   git commit -m "Add Railway deployment config and frontend connection"
   git push origin chatbot_backend
   ```

2. **Deploy on Railway**
   - Go to https://railway.app/
   - Click "Start a New Project"
   - Choose "Deploy from GitHub repo"
   - Select `BU-Spark/dd4g-cfjj`
   - Select branch: `chatbot_backend`
   - **Important**: Set Root Directory to `backend_chatbot_fastapi`

3. **Add Environment Variables** in Railway dashboard:
   ```
   GCP_PROJECT_ID=dd4g-cfjj-chatbot
   GCS_BUCKET_NAME=sro-complaints-data-dd4g-cfjj-chatbot
   LOCATION=us-central1
   GOOGLE_API_KEY=<your-actual-api-key>
   GEMINI_MODEL=gemini-2.5-pro
   ```

4. **Copy your Railway URL** (looks like: `https://something.up.railway.app`)

### Step 2: Connect Frontend to Backend

1. **Update frontend/.env**
   ```bash
   cd frontend
   ```

   Edit `.env` file and replace the Railway URL:
   ```
   VITE_API_BASE_URL=https://your-actual-railway-url.up.railway.app
   ```

2. **Test locally first** (optional)

   Terminal 1 - Run backend locally:
   ```bash
   cd backend_chatbot_fastapi
   python backend.py
   ```

   Terminal 2 - Run frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Visit http://localhost:5173

### Step 3: Test the Connection

**Test backend health**:
```bash
curl https://your-railway-url.up.railway.app/health
```

Expected:
```json
{"status":"healthy","message":"API is operational"}
```

**Test from frontend**:
1. Open your frontend (http://localhost:5173 or deployed URL)
2. Go to Knowledge Base page
3. Upload a CSV file
4. Go to Chat page
5. Ask a question

## API Endpoints

Your FastAPI backend provides:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check if API is running |
| `/ingest` | POST | Upload CSV/Excel complaint data |
| `/query` | POST | Ask questions about the data |
| `/cache/clear` | POST | Clear response cache |
| `/cache/stats` | GET | View cache statistics |
| `/corpus/status` | GET | Check RAG corpus status |

## Frontend API Integration

The frontend uses these functions (in `src/api/client.js`):

```javascript
// Ask a question
const response = await sendMessage("What are the demographics?", [])
// Returns: { answer: "...", reasoning: "...", sources: [...], num_sources: 5 }

// Upload CSV
const result = await uploadCSV(file)
// Returns: { status: "success", message: "...", total_complaints: 458, ... }
```

## Environment Variables Reference

### Backend (.env in backend_chatbot_fastapi/)
```bash
GCP_PROJECT_ID=dd4g-cfjj-chatbot
GCS_BUCKET_NAME=sro-complaints-data-dd4g-cfjj-chatbot
LOCATION=us-central1
GOOGLE_API_KEY=<your-api-key>
GEMINI_MODEL=gemini-2.5-pro
```

### Frontend (.env in frontend/)
```bash
# Clerk Auth
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# FastAPI Backend (RAG + Ingestion)
VITE_API_BASE_URL=https://your-railway-url.up.railway.app

# Legacy backend (if you have another backend for chat history)
VITE_API_URL=http://localhost:3001
```

## Testing Checklist

- [ ] Backend deploys successfully on Railway
- [ ] `/health` endpoint returns 200 OK
- [ ] Environment variables are set in Railway
- [ ] Frontend .env has correct Railway URL
- [ ] CSV upload works (go to Knowledge Base page)
- [ ] Chat queries work (go to Chat page)
- [ ] No CORS errors in browser console
- [ ] Responses include sources and reasoning

## Common Issues

### Issue: CORS Error
**Symptom**: Browser console shows "blocked by CORS policy"

**Solution**: Backend already allows all origins (`allow_origins=["*"]`). For production, update `backend.py`:
```python
allow_origins=[
    "https://your-frontend-domain.com",
    "http://localhost:5173",
]
```

### Issue: 404 Not Found
**Symptom**: API calls return 404

**Check**:
- Is Railway URL correct in frontend/.env?
- Are you using `/query` and `/ingest` (not `/api/query`, `/api/ingest`)?
- Is backend deployed and running? Check Railway logs

### Issue: 500 Internal Server Error
**Symptom**: Backend returns 500 error

**Check Railway logs**:
1. Go to Railway dashboard
2. Click your project
3. View "Deployments" → "Logs"
4. Look for Python errors

Common causes:
- Missing environment variables
- GCP authentication issues
- Invalid API key

### Issue: Authentication Error (GCP)
**Symptom**: Logs show "Could not automatically determine credentials"

**Solution**: Add GCP service account credentials to Railway:
1. Copy your service account JSON file content
2. In Railway, add variable `GOOGLE_APPLICATION_CREDENTIALS`
3. Paste the entire JSON content as the value

## Architecture Diagram

```
┌─────────────┐
│   Frontend  │ (React + Vite)
│ localhost:  │ http://localhost:5173
│    5173     │ or Vercel/Netlify
└──────┬──────┘
       │ HTTPS
       │ fetch()
       ▼
┌─────────────┐
│   Railway   │ https://xyz.up.railway.app
│   FastAPI   │
│   Backend   │ /query, /ingest, /health
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  Google Cloud Platform      │
│  - Cloud Storage (CSV data) │
│  - Vertex AI RAG Corpus     │
│  - Gemini API (answers)     │
└─────────────────────────────┘
```

## Deployment Checklist

### Backend (Railway)
- [x] Procfile created
- [x] railway.json created
- [x] runtime.txt created
- [ ] Pushed to GitHub
- [ ] Deployed on Railway
- [ ] Environment variables configured
- [ ] `/health` endpoint responds

### Frontend (Local/Production)
- [x] MOCK mode disabled in client.js
- [x] API endpoints updated to match backend
- [x] .env file created
- [ ] Railway URL added to .env
- [ ] npm install completed
- [ ] npm run dev works locally
- [ ] Upload CSV works
- [ ] Chat queries work

## Next Steps

1. Deploy backend to Railway (see RAILWAY_DEPLOYMENT.md)
2. Update frontend .env with Railway URL
3. Test locally: `cd frontend && npm run dev`
4. Deploy frontend to Vercel/Netlify (optional)
5. Share with client!

## Support

- Backend docs: `backend_chatbot_fastapi/CLAUDE.md`
- Railway docs: `backend_chatbot_fastapi/RAILWAY_DEPLOYMENT.md`
- Railway support: https://railway.app/help
