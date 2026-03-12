# SRO Complaints Frontend

A React-based web interface for analyzing POST Commission complaint records involving School Resource Officers (SROs).

**Frontend**: React + Vite SPA  
**Backend**: Express REST API + FastAPI (built separately)

---

## Project Structure
```
frontend/
├── src/
│   ├── api/
│   │   └── client.js              # Mock API client (CSV upload)
│   ├── components/
│   │   └── Layout.jsx             # App shell (header, nav, outlet)
│   ├── lib/
│   │   ├── api.js                 # Authenticated API client (chat)
│   │   └── utils.js               # Shared utilities (cn helper)
│   ├── pages/
│   │   ├── Chat.jsx               # Chat interface with history sidebar
│   │   └── KnowledgeBase.jsx      # CSV upload + data library
│   ├── App.jsx                    # Router + auth gates
│   ├── main.jsx                   # Entry point
│   └── index.css                  # Global styles + Tailwind
├── .env                           # Environment variables (not in git)
├── .env.example                   # Environment variable template
├── vite.config.js                 # Vite config + dev proxy
└── package.json
```

---

## Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment

Create a `.env` file in the `frontend/` directory:
```bash
# Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Backend API
VITE_API_URL=http://localhost:3001
```

### 3. Run the Frontend
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

---

## Pages

### Chat (`/`)
- Sidebar with saved chat history (load, delete, new chat)
- Welcome screen with suggested analytical prompts
- Message thread with user/assistant bubbles
- Textarea input with Enter to send, Shift+Enter for new line
- Auto-scroll to latest message
- Thinking indicator while awaiting response

### Knowledge Base (`/knowledge`)
- Drag and drop CSV upload zone
- Client-side file validation (CSV only, 50MB limit)
- Instant row count + data type detection via PapaParse
- Data library table showing all uploaded files
- Per-file status: Processing → Ready / Failed
- Remove files from the library

---

## API Endpoints Consumed

### Express Backend (`VITE_API_URL`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/chats` | List user's chat history |
| `POST` | `/api/chats` | Create new chat |
| `GET` | `/api/chats/:id` | Load a specific chat |
| `PUT` | `/api/chats/:id/messages` | Append message to chat |
| `DELETE` | `/api/chats/:id` | Delete a chat |

### FastAPI Backend

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ingest` | Upload CSV for ingestion pipeline |
| `POST` | `/query` | Ask a question (wired when `MOCK=false`) |

---

## Mock Mode

`src/api/client.js` has a `MOCK` flag for frontend development without a running backend:
```js
const MOCK = true   // flip to false when backend is ready
```

When `MOCK = true`:
- CSV upload returns `{ added: null, duplicates: null, type: null }` after a fake delay
- Row count and data type are still detected client-side via PapaParse

> **Note**: `src/lib/api.js` (used by Chat) does not have a mock mode — it always calls the real Express backend. Chat requires the backend to be running.

---

## Data Flow

### Chat Flow
```
User types message
      ↓
JWT attached (lib/api.js)
      ↓
POST /api/chats or PUT /api/chats/:id/messages (Express)
      ↓
Assistant response saved to MongoDB
      ↓
Message displayed in thread
```

### Ingestion Flow
```
User uploads CSV
      ↓
PapaParse reads headers + row count (browser, instant)
      ↓
Row added to table as "Processing"
      ↓
POST /ingest (FastAPI) — CSV → JSONL → GCS → Vertex AI
      ↓
Row updated to "Ready" with final record count
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Icons | Lucide React |
| CSV Parsing | PapaParse |
| HTTP | Native fetch API |

---

## Development Notes

- `src/api/client.js` — used only by `KnowledgeBase.jsx`
- `src/lib/api.js` — used only by `Chat.jsx`
- Chat history persists across sessions via MongoDB, not React state
- File upload state (Data Library table) is in-memory only — resets on page refresh until backend ingestion is wired up

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
> **Status**: Development — frontend UI complete, pending backend integration for Chat query responses and CSV ingestion pipeline
