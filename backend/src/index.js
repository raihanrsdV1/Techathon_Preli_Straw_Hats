require('dotenv').config(); // Load .env file first
const express = require('express');
const cors = require('cors');
const http = require('http'); // Import http
const { Server } = require("socket.io"); // Import socket.io Server
const createMainRouter = require('./routes'); // Import the router factory function
const errorMiddleware = require('./middleware/error');
const config = require('./config');
const sql = require('./db/db.js'); // Import the db connection instance

const app = express();
const server = http.createServer(app); // Create HTTP server from Express app

// --- CORS Configuration ---
const corsOptions = {
    origin: 'http://localhost:5173', // Frontend URL
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
};

// --- Middleware ---
app.use(cors(corsOptions));
app.use(express.json()); // Middleware to parse JSON bodies

// --- Socket.IO Setup ---
const io = new Server(server, { // Initialize Socket.IO server
    cors: corsOptions // Use the same CORS options for WebSockets
});

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
    });
});

// --- Routes ---
// Pass the io instance to the router factory
const mainRouter = createMainRouter(io);
app.use(mainRouter); // Use the configured router

// --- Error Handling Middleware ---
// Ensure this is registered *after* all routes
app.use(errorMiddleware);

// --- Start Server ---
server.listen(config.port, () => {
    console.log(`Backend server running with Socket.IO on port ${config.port}`);
});