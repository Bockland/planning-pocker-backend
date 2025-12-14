const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const socketHandler = require('./socket/handler');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/planning-poker')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for simplicity in this demo
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  socketHandler(io, socket);
});

// Routes
app.get('/', (req, res) => {
  res.send('Planning Poker Server is running');
});

const PORT = 3000; // Hardcoded port 3000 as per common practice
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
