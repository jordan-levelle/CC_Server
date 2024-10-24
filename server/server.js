const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const EventEmitter = require('events');
const voteEmitter = new EventEmitter();
const { createServer } = require('node:http');
const { Server } = require('socket.io');
require('dotenv').config();

const propCheckExpiredScheduler = require('./utils/Scheduler.js');
const documentRoutes = require('./routes/Documents.js');
const proposalRoutes = require('./routes/Proposals');
const userRoutes = require('./routes/Users');
const teamRoutes = require('./routes/Teams.js');
const webhookRoutes = require('./webhooks/webhookHandler');
const socketHandlers = require('./webhooks/socketHandler.js'); // Import socketHandlers

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }
});

// Middleware to enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Middleware to parse incoming requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ type: req => !req.originalUrl.startsWith('/api/webhooks') }));

// Make io and voteEmitter accessible within routes and controllers
app.use((req, res, next) => {
  req.io = io;
  req.voteEmitter = voteEmitter; // Add voteEmitter to the request object
  next();
});

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Consensus Check API!');
});

// API routes
app.use('/api/documents', documentRoutes);
app.use('/api/proposals', proposalRoutes); // Proposal routes have access to io
app.use('/api/user', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/webhooks', webhookRoutes);

// Initialize socket.io handlers
socketHandlers(io, voteEmitter); // Pass io to socketHandlers to handle all socket logic

// Connect to MongoDB and start the server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    // Start the scheduler
    propCheckExpiredScheduler();

    // Start the server
    server.listen(process.env.PORT || 3000, () => {
      console.log('Connected to db & listening on port', process.env.PORT);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });
