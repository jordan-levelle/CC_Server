const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const EventEmitter = require('events');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
require('dotenv').config();

const propCheckExpiredScheduler = require('./utils/Scheduler.js');
const documentRoutes = require('./routes/Documents.js');
const proposalRoutes = require('./routes/Proposals');
const userRoutes = require('./routes/Users');
const teamRoutes = require('./routes/Teams.js');
const webhookRoutes = require('./webhooks/webhookHandler');
const socketHandlers = require('./webhooks/socketHandler.js');
const getGFSBucket = require('./utils/gridfs.js');
const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }
});

const voteEmitter = new EventEmitter();

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Initialize event emitter and socket.io in routes
app.use((req, res, next) => {
  req.io = io;
  req.voteEmitter = voteEmitter;
  next();
});

console.log('Connecting to MongoDB at:', process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    mongoose.connection.once('open', () => {
      const gfs = getGFSBucket();  // Initialize and get GridFSBucket instance
      app.set('gfs', gfs);
      console.log('GridFSBucket connection established and set in app.');

      // Initialize only document routes after GridFS is ready
      app.use('/api/documents', documentRoutes);
    });

    // Initialize other routes right after DB connection, outside of GridFS
    app.use('/api/proposals', proposalRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/teams', teamRoutes);
    app.use('/api/webhooks', webhookRoutes);

          // Start scheduler and server
          propCheckExpiredScheduler();
          server.listen(process.env.PORT || 3000, () => {
            console.log('Connected to db & listening on port', process.env.PORT || 3000);
          });
  })
  .catch((error) => console.error('MongoDB connection error:', error));

// Initialize socket.io handlers
socketHandlers(io, voteEmitter);

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Consensus Check API!');
});

module.exports = server;
