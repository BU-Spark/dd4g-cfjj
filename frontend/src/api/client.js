const MOCK = true

export const sendMessage = async (message, history) => {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 800))
    return { answer: "This is a mock response from the RAG engine." }
  }
  const BASE = import.meta.env.VITE_API_BASE_URL
  return fetch(`${BASE}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history })
  }).then(r => r.json())
}

export const uploadCSV = async (file) => {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 1200))
    return { added: 42, duplicates: 7 }
  }
  const BASE = import.meta.env.VITE_API_BASE_URL
  const form = new FormData()
  form.append('file', file)
  return fetch(`${BASE}/api/ingest`, {
    method: 'POST',
    body: form
  }).then(r => r.json())
}
