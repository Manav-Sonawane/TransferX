const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { errorHandler } = require('./middlewares/error.middleware');
const authRoutes = require('./routes/auth.routes');

const fileRoutes = require('./routes/file.routes');
const shareRoutes = require('./routes/share.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const downloadRoutes = require('./routes/download.routes');


const app = express();

// Trust the first hop's X-Forwarded-For (a single reverse proxy in front of
// this server — e.g. Render/Railway/Vercel's edge). Without this, req.ip is
// always the proxy's own address in production, which breaks per-IP rate
// limiting; with it, req.ip resolves to the real client IP from a header the
// proxy itself sets, not one an end client can spoof past the proxy.
// Adjust TRUST_PROXY if there's more than one hop between the client and this process.
app.set('trust proxy', process.env.TRUST_PROXY || 1);

// ─── Security Headers ─────────────────────────
app.use(helmet());

// ─── CORS ────────────────────────────────────
const getAllowedOrigins = () => {
    const raw = process.env.CLIENT_URL || 'http://localhost:5173';
    return raw
        .split(',')
        .map((url) => url.trim().replace(/\/+$/, ''))
        .filter(Boolean);
};

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, curl, etc.) or in development
            if (!origin || process.env.NODE_ENV !== 'production') {
                return callback(null, true);
            }
            const allowedOrigins = getAllowedOrigins();
            const normalizedOrigin = origin.replace(/\/+$/, '');
            if (allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes('*')) {
                callback(null, true);
            } else {
                callback(new Error(`CORS: Origin ${origin} not allowed`));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Access-Token'],
        exposedHeaders: ['Content-Disposition', 'Content-Length', 'Content-Type'],
    })
);

// ─── Body Parsers ─────────────────────────────
// File uploads go through multer/multipart (upload.middleware.js), not JSON —
// these limits only apply to JSON/urlencoded bodies (auth, shares, dashboard),
// none of which need anywhere near 100MB. A large limit here is just an
// unnecessary large-payload attack surface.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Cookie Parser ────────────────────────────
app.use(cookieParser());

// ─── Logger ───────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

// ─── Health Check ─────────────────────────────
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'TransferX API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'healthy' });
});

// ─── WebRTC ICE Server Config ─────────────────
// Serves TURN credentials from the environment instead of the client
// hardcoding a public demo relay. TURN_URL/TURN_USERNAME/TURN_PASSWORD are
// unset by default (see server/.env) — falls back to the public demo relay
// so P2P still works out of the box in development; provision a real TURN
// server and set those vars before relying on this in production, since the
// public relay has no SLA or capacity guarantee.
app.get('/api/ice-servers', (req, res) => {
    const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ];

    if (process.env.TURN_URL && process.env.TURN_USERNAME && process.env.TURN_PASSWORD) {
        iceServers.push({
            urls: process.env.TURN_URL,
            username: process.env.TURN_USERNAME,
            credential: process.env.TURN_PASSWORD,
        });
    } else {
        iceServers.push(
            { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
            { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
            { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
        );
    }

    res.json({ success: true, iceServers });
});

// ─── API Routes ───────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/download', downloadRoutes);


// ─── 404 Handler ─────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ─────────────────────
app.use(errorHandler);

module.exports = app;