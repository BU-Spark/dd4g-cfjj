const express = require('express');
const { requireAuth } = require('@clerk/express');
const Chat = require('../models/Chat');

const router = express.Router();

// All routes require auth
router.use(requireAuth());

// GET /api/chats — list user's chats
router.get('/', async (req, res) => {
    try {
        const chats = await Chat.find({ userId: req.auth.userId })
            .select('title createdAt updatedAt')
            .sort({ updatedAt: -1 });
        res.json(chats);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
});

// POST /api/chats — create new chat
router.post('/', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'message is required' });

        const title = message.slice(0, 60);
        const chat = await Chat.create({
            userId: req.auth.userId,
            title,
            messages: [{ role: 'user', content: message }]
        });
        res.status(201).json(chat);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create chat' });
    }
});

// GET /api/chats/:id — get single chat
router.get('/:id', async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);
        if (!chat) return res.status(404).json({ error: 'Not found' });
        if (chat.userId !== req.auth.userId) return res.status(403).json({ error: 'Forbidden' });
        res.json(chat);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch chat' });
    }
});

// PUT /api/chats/:id/messages — append message
router.put('/:id/messages', async (req, res) => {
    try {
        const { role, content } = req.body;
        if (!role || !content) return res.status(400).json({ error: 'role and content are required' });

        const chat = await Chat.findById(req.params.id);
        if (!chat) return res.status(404).json({ error: 'Not found' });
        if (chat.userId !== req.auth.userId) return res.status(403).json({ error: 'Forbidden' });

        chat.messages.push({ role, content });
        await chat.save();
        res.json(chat);
    } catch (err) {
        res.status(500).json({ error: 'Failed to append message' });
    }
});

// DELETE /api/chats/:id
router.delete('/:id', async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);
        if (!chat) return res.status(404).json({ error: 'Not found' });
        if (chat.userId !== req.auth.userId) return res.status(403).json({ error: 'Forbidden' });

        await chat.deleteOne();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete chat' });
    }
});

module.exports = router;
