const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function createApiClient(getToken) {
    async function authFetch(path, options = {}) {
        const token = await getToken();
        const res = await fetch(`${API_URL}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...options.headers,
            },
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Request failed: ${res.status}`);
        }
        return res.json();
    }

    return {
        listChats: () => authFetch('/api/chats'),
        createChat: (message) => authFetch('/api/chats', {
            method: 'POST',
            body: JSON.stringify({ message }),
        }),
        getChat: (id) => authFetch(`/api/chats/${id}`),
        appendMessage: (id, role, content) => authFetch(`/api/chats/${id}/messages`, {
            method: 'PUT',
            body: JSON.stringify({ role, content }),
        }),
        deleteChat: (id) => authFetch(`/api/chats/${id}`, { method: 'DELETE' }),

        listRagFiles: () => authFetch('/api/rag/files'),

        downloadRagFile: async (gcsUri) => {
            const token = await getToken();
            const res = await fetch(`${API_URL}/api/rag/files/download?uri=${encodeURIComponent(gcsUri)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`Download failed: ${res.status}`);
            return res.blob();
        },

        queryMessage: (message, history) => authFetch('/api/query', {
            method: 'POST',
            body: JSON.stringify({ message, history }),
        }),

        uploadRagFile: async (file) => {
            const token = await getToken();
            const form = new FormData();
            form.append('file', file);
            const res = await fetch(`${API_URL}/api/rag/files/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: form,
            });
            if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
            return res.json();
        },
    };
}
