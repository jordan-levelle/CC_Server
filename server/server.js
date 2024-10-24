// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
require('dotenv').config();

const propCheckExpiredScheduler = require('./utils/Scheduler.js');
const documentRoutes = require('./routes/Documents.js');
const proposalRoutes = require('./routes/Proposals');
const userRoutes = require('./routes/Users');
const teamRoutes = require('./routes/Teams.js');
const webhookRoutes = require('./webhooks/webhookHandler');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ type: req => !req.originalUrl.startsWith('/api/webhooks') }));

// Make io accessible within routes and controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get('/', (req, res) => {
  res.send('Welcome to the Consensus Check API!');
});

app.use('/api/documents', documentRoutes);
app.use('/api/proposals', proposalRoutes); // Proposal route now has access to io
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
