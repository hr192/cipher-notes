const express = require('express');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * In-memory paste storage
 * In production, this would be replaced with a database
 */
const pasteStore = new Map();

/**
 * Session store for paste ownership
 * Maps session ID to paste ID
 */
const sessionStore = new Map();

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Middleware: Session authentication
app.use((req, res, next) => {
    // Generate or retrieve session
    let sessionId = req.cookies?.sessionId;
    if (!sessionId) {
        sessionId = uuidv4();
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
    }
    req.sessionId = sessionId;
    next();
});

/**
 * Middleware: Parse cookies
 */
function parseCookies(req) {
    const cookies = {};
    if (req.headers.cookie) {
        req.headers.cookie.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            cookies[name] = value;
        });
    }
    return cookies;
}

// Override cookie parsing since express.static doesn't support cookies easily
app.use((req, res, next) => {
    req.cookies = parseCookies(req);
    next();
});

/**
 * POST /api/paste - Create a new encrypted paste
 */
app.post('/api/paste', (req, res) => {
    try {
        const { content, autoDelete, expiryHours } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        if (content.length > 1048576) {
            return res.status(413).json({ error: 'Paste exceeds 1MB limit' });
        }

        const pasteId = uuidv4();
        const expiryTime = expiryHours ? Date.now() + (expiryHours * 60 * 60 * 1000) : null;

        const paste = {
            id: pasteId,
            content: content,
            createdAt: Date.now(),
            expiryTime: expiryTime,
            autoDelete: autoDelete,
            ownedBy: req.sessionId,
            // Metadata for abuse prevention
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        };

        pasteStore.set(pasteId, paste);
        sessionStore.set(req.sessionId, pasteId);

        // Set expiry timeout if needed
        if (expiryTime) {
            setTimeout(() => {
                pasteStore.delete(pasteId);
            }, expiryHours * 60 * 60 * 1000);
        }

        res.status(201).json({
            id: pasteId,
            message: 'Paste created successfully'
        });
    } catch (error) {
        console.error('Error creating paste:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/paste/:id - Retrieve encrypted paste
 */
app.get('/api/paste/:id', (req, res) => {
    try {
        const pasteId = req.params.id;
        const paste = pasteStore.get(pasteId);

        if (!paste) {
            return res.status(404).json({ error: 'Paste not found' });
        }

        // Check if paste has expired
        if (paste.expiryTime && Date.now() > paste.expiryTime) {
            pasteStore.delete(pasteId);
            return res.status(404).json({ error: 'Paste has expired' });
        }

        // Check if user is owner
        const isOwner = paste.ownedBy === req.sessionId;

        res.json({
            id: pasteId,
            content: paste.content,
            isOwner: isOwner,
            createdAt: paste.createdAt
        });

        // Delete if autoDelete is enabled
        if (paste.autoDelete && isOwner) {
            pasteStore.delete(pasteId);
        }
    } catch (error) {
        console.error('Error retrieving paste:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/paste/:id - Update a paste (owner only)
 */
app.put('/api/paste/:id', (req, res) => {
    try {
        const pasteId = req.params.id;
        const { content } = req.body;
        const paste = pasteStore.get(pasteId);

        if (!paste) {
            return res.status(404).json({ error: 'Paste not found' });
        }

        // Verify ownership
        if (paste.ownedBy !== req.sessionId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        if (content.length > 1048576) {
            return res.status(413).json({ error: 'Paste exceeds 1MB limit' });
        }

        // Update paste
        paste.content = content;
        paste.updatedAt = Date.now();

        res.json({
            id: pasteId,
            message: 'Paste updated successfully'
        });
    } catch (error) {
        console.error('Error updating paste:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/paste/:id - Delete a paste (owner only)
 */
app.delete('/api/paste/:id', (req, res) => {
    try {
        const pasteId = req.params.id;
        const paste = pasteStore.get(pasteId);

        if (!paste) {
            return res.status(404).json({ error: 'Paste not found' });
        }

        // Verify ownership
        if (paste.ownedBy !== req.sessionId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        pasteStore.delete(pasteId);
        res.json({ message: 'Paste deleted successfully' });
    } catch (error) {
        console.error('Error deleting paste:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /health - Health check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        pasteCount: pasteStore.size
    });
});

/**
 * GET / - Serve main app (frontend)
 * Always show frontend, even on 404
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

/**
 * Handle 404 - Redirect to frontend
 */
app.use((req, res) => {
    // For API calls, return 404 JSON
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Endpoint not found' });
    }
    // For everything else, serve the frontend (single-page app)
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

/**
 * Error handler
 */
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n📋🔐 Cipher Notes is running!`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`\n💡 Start typing or paste content to encrypt and share.\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});
