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

// ─── Security Headers ─────────────────────────
app.use(helmet());

// ─── CORS ────────────────────────────────────
app.use(
    cors({
        origin: (origin, callback) => {
            // In development, allow all origins for cross-device testing.
            // In production, restrict to the configured CLIENT_URL.
            if (process.env.NODE_ENV !== 'production') {
                return callback(null, true);
            }
            const allowed = process.env.CLIENT_URL || 'http://localhost:5173';
            if (!origin || origin === allowed) {
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
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

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