const express = require('express');
const { requireAuth } = require('@clerk/express');
const { GoogleAuth } = require('google-auth-library');

const router = express.Router();

router.use(requireAuth());

async function getAccessToken() {
    const auth = new GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    return tokenResponse.token;
}

// POST /api/query
router.post('/query', async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        if (!message) return res.status(400).json({ error: 'message is required' });

        const { LOCATION, GCP_PROJECT_ID, RAG_CORPUS_ID, GEMINI_MODEL } = process.env;
        const token = await getAccessToken();

        // Build conversation history in Gemini format
        const contents = [
            ...history.map(({ role, content }) => ({
                role: role === 'assistant' ? 'model' : 'user',
                parts: [{ text: content }],
            })),
            { role: 'user', parts: [{ text: message }] },
        ];

        const body = {
            contents,
            tools: [{
                retrieval: {
                    vertexRagStore: {
                        ragResources: [{ ragCorpus: RAG_CORPUS_ID }],
                    },
                },
            }],
        };

        const url = `https://${LOCATION}-aiplatform.googleapis.com/v1beta1/projects/${GCP_PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${GEMINI_MODEL}:generateContent`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const err = await response.text();
            return res.status(response.status).json({ error: `Vertex AI error: ${err}` });
        }

        const data = await response.json();
        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
        res.json({ answer });
    } catch (err) {
        console.error('Query error:', err);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

module.exports = router;
