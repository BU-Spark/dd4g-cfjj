# SRO Complaints Backend

A Node.js/Express REST API handling chat persistence and RAG corpus management for the SRO Complaints platform.

**Backend**: Express + MongoDB + Clerk  
**Frontend**: React + Vite (built separately)  
**RAG Engine**: FastAPI + Vertex AI (built separately)

---

## Project Structure
```
backend/
├── models/
│   └── Chat.js                # Mongoose schema for chat history
├── routes/
│   ├── chats.js               # Chat CRUD endpoints
│   └── rag.js                 # Vertex AI RAG corpus endpoints
├── .env                       # Environment variables (not in git)
├── .env.example               # Environment variable template
├── index.js                   # Entry point (Express app + MongoDB)
├── package.json
└── package-lock.json
```

---

## Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment

Create a `.env` file in the `backend/` directory:
```bash
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Clerk
CLERK_SECRET_KEY=sk_test_your_key_here

# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
LOCATION=us-east5
RAG_CORPUS_ID=projects/your-project/locations/us-east5/ragCorpora/your-corpus-id

# Server
PORT=3001
```

### 3. Run the Backend
```bash
node index.js
```

The API will be available at `http://localhost:3001`

---

## API Endpoints

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check |

### Chat History (`/api/chats`)

All endpoints require a valid Clerk JWT bearer token.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/chats` | List authenticated user's chats |
| `POST` | `/api/chats` | Create new chat, body: `{ message }` |
| `GET` | `/api/chats/:id` | Get single chat with full message history |
| `PUT` | `/api/chats/:id/messages` | Append message, body: `{ role, content }` |
| `DELETE` | `/api/chats/:id` | Delete a chat |

### RAG Corpus (`/api/rag`)

All endpoints require a valid Clerk JWT. Upload endpoint requires `admin` role.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/rag/files` | List files in the Vertex AI RAG corpus |
| `GET` | `/api/rag/files/download?uri=<gcs-uri>` | Proxy download a file from GCS |
| `POST` | `/api/rag/files/upload` | Upload file to corpus (admin only, not yet implemented) |

---

## Authentication

All routes are protected by Clerk via `requireAuth()` middleware from `@clerk/express`. Every request must include a valid JWT bearer token in the `Authorization` header:
```
Authorization: Bearer <clerk_jwt>
```

The frontend's `src/lib/api.js` attaches this token automatically on every request.

### Admin Role

The RAG upload endpoint additionally requires an `admin` role set in Clerk's public metadata:
```json
{ "role": "admin" }
```

Non-admin users receive a `403 Forbidden` response.

---

## Data Models

### Chat
```
Chat
├── userId        String    Clerk user ID (indexed)
├── title         String    First 60 chars of opening message
├── messages[]
│   ├── role      String    "user" | "assistant"
│   ├── content   String
│   └── createdAt Date
├── createdAt     Date      Auto (timestamps)
└── updatedAt     Date      Auto (timestamps)
```

---

## Google Cloud Integration

The RAG routes use a Google Cloud service account to authenticate with:

- **Vertex AI RAG API** — lists corpus files
- **Google Cloud Storage** — proxies file downloads

The service account key path is set via `GOOGLE_APPLICATION_CREDENTIALS` in `.env`.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Express |
| Database | MongoDB Atlas + Mongoose |
| Auth | Clerk (`@clerk/express`) |
| GCP Auth | google-auth-library |
| Runtime | Node.js |

---

## Development Notes

- Chat ownership is enforced per-request — users can only access their own chats
- The RAG upload endpoint (`POST /api/rag/files/upload`) is stubbed and returns `501 Not Implemented`
- CORS is configured for `localhost:5173` and `localhost:5174` (Vite dev server ports)
- Server will exit on MongoDB connection failure

---

## Client Information

- **Client**: Citizens for Juvenile Justice (CFJJ)
- **Contact**: Josh Dankoff (joshuadankoff@cfjj.org)
- **Data Source**: Massachusetts POST Commission PRR Dataset
- **Purpose**: Analyze patterns in SRO complaints involving youth under 18

---

## License

Built for SPARK-CDS-DD4G Program | Boston University | Spring 2026

---

> **Last Updated**: 2026-03-12  
> **Status**: Development — chat persistence complete, RAG file upload endpoint pending implementation
