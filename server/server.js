const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createServer } = require('node:http');
require('dotenv').config();

const { initializeBackblaze } = require('./utils/Backblaze.js');
const propCheckExpiredScheduler = require('./utils/Scheduler.js');
const documentRoutes = require('./routes/Documents');
const proposalRoutes = require('./routes/Proposals');
const userRoutes = require('./routes/Users');
const teamRoutes = require('./routes/Teams.js');
const adminRoutes = require('./routes/Admin.js');
const webhookRoutes = require('./webhooks/webhookHandler');

const app = express();
const server = createServer(app);

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Allow preflight requests for all routes

// Middleware for standard routes
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Mount Stripe webhook route with raw body parsing
// This ensures that only the `/webhooks` route uses raw body parsing
app.use('/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

console.log('Connecting to MongoDB at:', process.env.MONGO_URI);

// Initialize Backblaze
initializeBackblaze()
  .then(() => {
    console.log('Backblaze initialized successfully');

    // Connect to MongoDB
    return mongoose.connect(process.env.MONGO_URI);
  })
  .then(() => {
    console.log('Connected to MongoDB');

    // Register all other routes
    app.use('/api/documents', documentRoutes);
    app.use('/api/proposals', proposalRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/teams', teamRoutes);
    app.use('/api/admin', adminRoutes);

    // Start scheduler and server
    propCheckExpiredScheduler();
    server.listen(process.env.PORT || 3000, () => {
      console.log('Connected to db & listening on port', process.env.PORT || 3000);
    });
  })
  .catch((error) => {
    console.error('Server startup error:', error);
    process.exit(1); // Exit the process on critical failure
  });

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Consensus Check API!');
});

module.exports = server;
