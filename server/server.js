const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const EventEmitter = require('events');
const { GridFSBucket } = require('mongodb');
const multer = require('multer');
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

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ type: req => !req.originalUrl.startsWith('/api/webhooks') }));

// Initialize event emitter and socket.io in routes
app.use((req, res, next) => {
  req.io = io;
  req.voteEmitter = new EventEmitter();
  next();
});

// MongoDB connection and GridFS setup
let gfs, gridFSBucket;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    const conn = mongoose.connection;
    gridFSBucket = new GridFSBucket(conn.db, { bucketName: 'uploads' });
    
    conn.once('open', () => {
      gfs = gridFSBucket;
      app.set('gfs', gfs);
      console.log('GridFSBucket connection established.');
    });

    // Start scheduler and server
    propCheckExpiredScheduler();
    server.listen(process.env.PORT || 3000, () => {
      console.log('Connected to db & listening on port', process.env.PORT || 3000);
    });
  })
  .catch((error) => console.error('MongoDB connection error:', error));

// Multer storage setup with GridFS
const storage = multer.memoryStorage(); // Temporary storage in memory

// Routes
app.use('/api/documents', documentRoutes); 
app.use('/api/proposals', proposalRoutes);
app.use('/api/user', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/webhooks', webhookRoutes);

// Initialize socket.io handlers
socketHandlers(io);

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Consensus Check API!');
});

module.exports = server;
