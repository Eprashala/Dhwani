const express = require('express');
const http = require('http');
const path = require('path'); // Add this
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- ADD THIS LINE BELOW ---
app.use(express.static(__dirname)); 
// This tells the server to serve all files (html, js, css) in this folder
// ---------------------------

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('signal', (data) => {
        socket.broadcast.emit('signal', data);
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Signaling server running on http://YOUR_IP:3000');
});