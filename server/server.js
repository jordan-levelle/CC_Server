const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const propCheckExpiredScheduler = require('./utils/Scheduler.js');
const documentRoutes = require('./routes/Documents.js');
const proposalRoutes = require('./routes/Proposals');
const userRoutes = require('./routes/Users');
const teamRoutes = require('./routes/Teams.js');
const webhookRoutes = require('./webhooks/webhookHandler');

const app = express();

// Create an HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server);

// Middleware to make `io` accessible in routes
app.use((req, res, next) => {
  req.io = io; // Attach io instance to req object
  next();
});

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ type: req => !req.originalUrl.startsWith('/api/webhooks') }));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Optionally listen for disconnect events
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Root path route
app.get('/', (req, res) => {
  res.send('Welcome to the Consensus Check API!');
});

// Routes
app.use('/api/documents', documentRoutes);
app.use('/api/proposals', proposalRoutes); // Pass io to proposal routes
app.use('/api/user', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/webhooks', webhookRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    propCheckExpiredScheduler();
    server.listen(process.env.PORT || 3000, () => {
      console.log('Connected to db & listening on port', process.env.PORT);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });
