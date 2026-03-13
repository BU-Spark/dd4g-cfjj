# Railway Deployment Guide - FastAPI Backend

## Quick Steps to Deploy on Railway

### 1. Prepare Your Backend (Already Done!)
- ✅ Procfile created
- ✅ railway.json created
- ✅ runtime.txt created
- ✅ requirements.txt exists

### 2. Deploy to Railway

**Option A: Deploy from GitHub (Recommended)**

1. **Push your code to GitHub**
   ```bash
   cd /Users/wasamchaudhry/Study/mass_mutual/cfjj/dd4g-cfjj
   git add backend_chatbot_fastapi/
   git commit -m "Add Railway deployment config"
   git push origin chatbot_backend
   ```

2. **Go to Railway**
   - Visit: https://railway.app/
   - Click "Start a New Project"
   - Choose "Deploy from GitHub repo"
   - Select your repository: `BU-Spark/dd4g-cfjj`
   - Select the branch: `chatbot_backend`
   - Set **Root Directory**: `backend_chatbot_fastapi`

**Option B: Deploy using Railway CLI**

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   # or
   brew install railway
   ```

2. **Login and Deploy**
   ```bash
   cd backend_chatbot_fastapi
   railway login
   railway init
   railway up
   ```

### 3. Configure Environment Variables in Railway

Once deployed, add these environment variables in Railway dashboard:

1. Go to your project → **Variables** tab
2. Add the following variables:

```
GCP_PROJECT_ID=dd4g-cfjj-chatbot
GCS_BUCKET_NAME=sro-complaints-data-dd4g-cfjj-chatbot
LOCATION=us-central1
GOOGLE_API_KEY=<your-api-key>
GEMINI_MODEL=gemini-2.5-pro
```

**Important**: For `GOOGLE_APPLICATION_CREDENTIALS`, you'll need to:
- Copy the content of your service account JSON file
- In Railway, create a variable called `GOOGLE_APPLICATION_CREDENTIALS` with the full JSON content as a string
- OR use Railway's secret file upload feature

### 4. Get Your Backend URL

After deployment, Railway will give you a URL like:
```
https://your-app-name.up.railway.app
```

**Test it**:
```bash
curl https://your-app-name.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "message": "API is operational"
}
```

### 5. Update Frontend to Use Railway Backend

In your frontend code, update the API base URL:

**frontend/src/config.js** (or wherever you store API config):
```javascript
export const API_BASE_URL = "https://your-app-name.up.railway.app";
```

Or use environment variables in frontend:
```javascript
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
```

Then create **frontend/.env**:
```
VITE_API_URL=https://your-app-name.up.railway.app
```

### 6. Test the Integration

**Test /ingest endpoint**:
```bash
curl -X POST "https://your-app-name.up.railway.app/ingest" \
  -F "file=@path/to/complaints.csv"
```

**Test /query endpoint**:
```bash
curl -X POST "https://your-app-name.up.railway.app/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the demographic breakdown?"}'
```

## Common Issues & Solutions

### Issue 1: Port Binding Error
**Solution**: Railway automatically sets `$PORT` environment variable. The Procfile uses it: `--port $PORT`

### Issue 2: GCP Authentication Fails
**Solution**:
- Make sure `GOOGLE_APPLICATION_CREDENTIALS` contains the full service account JSON
- Or use service account key file upload in Railway
- Verify the service account has these permissions:
  - Storage Admin
  - Vertex AI User
  - AI Platform Admin

### Issue 3: Module Not Found
**Solution**: Check that all dependencies are in `requirements.txt`

### Issue 4: CORS Errors from Frontend
**Solution**: Update CORS origins in `backend.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-domain.com",
        "http://localhost:5173",  # Vite dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Monitoring & Logs

- **View Logs**: Railway dashboard → Deployments → View Logs
- **Check Metrics**: Railway dashboard → Metrics tab
- **Health Check**: Visit `/health` endpoint

## Cost Estimate

Railway offers:
- **Free Tier**: $5 credit/month (good for development)
- **Pro Plan**: $20/month (for production)

Your FastAPI backend should run fine on the free tier for testing.

## Next Steps

1. Deploy backend to Railway
2. Get the Railway URL
3. Update frontend API base URL
4. Deploy frontend (Vercel, Netlify, or Railway)
5. Test end-to-end integration

## Useful Links

- Railway Dashboard: https://railway.app/dashboard
- Railway Docs: https://docs.railway.app/
- Project Settings: https://railway.app/project/{your-project-id}/settings
