require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/database");
const setupTransferSockets = require("./sockets/transfer.socket");

const PORT = process.env.PORT || 5000;

(async () => {
    await connectDB();

    const server = http.createServer(app);
    
    // Initialize Socket.IO
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Setup Socket Namespaces/Handlers
    setupTransferSockets(io);

    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
})();

