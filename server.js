const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/panel-control', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/servers', require('./routes/servers'));
app.use('/api/scripts', require('./routes/scripts'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/telegram', require('./routes/telegram'));

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-server', (serverId) => {
    socket.join(serverId);
  });

  socket.on('script-output', (data) => {
    socket.to(data.serverId).emit('script-output', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.set('io', io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
