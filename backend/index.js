require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { clerkMiddleware } = require('@clerk/express');
const chatsRouter = require('./routes/chats');
const ragRouter = require('./routes/rag');
const queryRouter = require('./routes/query');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178'] }));
app.use(express.json());
app.use(clerkMiddleware());

app.use('/api/chats', chatsRouter);
app.use('/api/rag', ragRouter);
app.use('/api', queryRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
        console.error('MongoDB connection failed:', err.message);
        process.exit(1);
    });
