require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/database");
const setupTransferSockets = require("./sockets/transfer.socket");
const { startExpiredCleanupJob } = require("./jobs/cleanupExpired.job");

const PORT = process.env.PORT || 5000;

// Fail fast at boot with a clear message instead of a cryptic failure deep
// inside a request handler (e.g. jwt.sign throwing on an undefined secret)
// the first time a route that needs one of these actually gets hit.
const REQUIRED_ENV_VARS = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'MONGODB_URI',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
];

const assertRequiredEnvVars = () => {
    const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.error(`Missing required environment variable(s): ${missing.join(', ')}`);
        process.exit(1);
    }
};

// Crash loudly and deliberately rather than leaving the process in an
// undefined state after an error nothing caught — e.g. a rejection inside a
// Socket.IO fire-and-forget handler, which has no request cycle to catch it.
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

(async () => {
    assertRequiredEnvVars();
    await connectDB();

    const server = http.createServer(app);

    // Initialize Socket.IO
    const io = new Server(server, {
        cors: {
            origin: process.env.NODE_ENV !== 'production'
                ? true  // allow all origins in dev for cross-device testing
                : (process.env.CLIENT_URL || 'http://localhost:5173'),
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Setup Socket Namespaces/Handlers
    setupTransferSockets(io);

    // Periodically purge expired files/shares (Cloudinary assets + DB rows)
    startExpiredCleanupJob();

    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });

    const shutdown = (signal) => {
        console.log(`${signal} received — shutting down gracefully`);
        io.close();
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
})();

