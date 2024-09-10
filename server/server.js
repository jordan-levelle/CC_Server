require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const propCheckExpiredScheduler = require('./utils/Scheduler.js');
const proposalRoutes = require('./routes/Proposals');
const userRoutes = require('./routes/Users');
const teamRoutes = require('./routes/Teams.js');
const webhookRoutes = require('./webhooks/webhookHandler');

// Express app
const app = express();

const corsOptions = {
  origin: ['http://localhost:3000', 'https://dev.consensuscheck.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Enable CORS with options
app.use(cors(corsOptions));

// Use JSON middleware globally, but not for webhooks
app.use(express.json({ type: req => !req.originalUrl.startsWith('/api/webhooks') }));

// Root path route
app.get('/', (req, res) => {
  res.send('Welcome to the Consensus Check API!');
});

// Routes
app.use('/api/proposals', proposalRoutes);
app.use('/api/user', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/webhooks', webhookRoutes);

// Connect to DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    propCheckExpiredScheduler();
    app.listen(process.env.PORT || 3000, () => {
      console.log('Connected to DB & listening on port', process.env.PORT || 3000);
    });
  })
  .catch((error) => {
    console.error('Database connection error:', error);
  });


  