const express = require('express');
const { requireAuth } = require('@clerk/express');
const { GoogleAuth } = require('google-auth-library');

const router = express.Router();

router.use(requireAuth());

function requireAdmin(req, res, next) {
    const role = req.auth.sessionClaims?.publicMetadata?.role;
    if (role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

async function getAccessToken() {
    const keyJson = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const auth = new GoogleAuth({
        credentials: keyJson,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    return tokenResponse.token;
}

// GET /api/rag/files — list files in the RAG corpus
router.get('/files', async (req, res) => {
    try {
        const { GOOGLE_PROJECT_ID, GOOGLE_LOCATION, RAG_CORPUS_ID } = process.env;
        const token = await getAccessToken();

        const url = `https://${GOOGLE_LOCATION}-aiplatform.googleapis.com/v1beta1/projects/${GOOGLE_PROJECT_ID}/locations/${GOOGLE_LOCATION}/ragCorpora/${RAG_CORPUS_ID}/ragFiles`;
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            const err = await response.text();
            return res.status(response.status).json({ error: `Vertex AI error: ${err}` });
        }

        const data = await response.json();
        const files = (data.ragFiles || []).map((file) => ({
            name: file.name,
            displayName: file.displayName || file.name.split('/').pop(),
            createTime: file.createTime,
            sizeBytes: file.sizeBytes || null,
            gcsUri: file.gcsSource?.uris?.[0] || null,
        }));

        res.json(files);
    } catch (err) {
        console.error('RAG list error:', err);
        res.status(500).json({ error: 'Failed to list RAG files' });
    }
});

// GET /api/rag/files/download?uri=<gcs-uri> — proxy file download from GCS
router.get('/files/download', async (req, res) => {
    try {
        const { uri } = req.query;
        if (!uri) return res.status(400).json({ error: 'uri query param is required' });

        // Parse gs://bucket/path/to/file
        const match = uri.match(/^gs:\/\/([^/]+)\/(.+)$/);
        if (!match) return res.status(400).json({ error: 'Invalid GCS URI format' });

        const [, bucket, object] = match;
        const encodedObject = encodeURIComponent(object).replace(/%2F/g, '%2F');
        const token = await getAccessToken();

        const gcsUrl = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodedObject}?alt=media`;
        const gcsResponse = await fetch(gcsUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!gcsResponse.ok) {
            const err = await gcsResponse.text();
            return res.status(gcsResponse.status).json({ error: `GCS error: ${err}` });
        }

        const filename = object.split('/').pop();
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', gcsResponse.headers.get('content-type') || 'application/octet-stream');

        const reader = gcsResponse.body.getReader();
        const stream = new require('stream').Readable({
            async read() {
                const { done, value } = await reader.read();
                if (done) {
                    this.push(null);
                } else {
                    this.push(Buffer.from(value));
                }
            },
        });
        stream.pipe(res);
    } catch (err) {
        console.error('RAG download error:', err);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

// POST /api/rag/files/upload — admin only
router.post('/files/upload', requireAdmin, async (req, res) => {
    // TODO: implement file upload to Vertex AI RAG corpus
    res.status(501).json({ error: 'Not implemented yet' });
});

module.exports = router;
