const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const propCheckExpiredScheduler = require('./utils/Scheduler.js');
const documentRoutes = require('./routes/Documents.js');
const proposalRoutes = require('./routes/Proposals');
const userRoutes = require('./routes/Users');
const teamRoutes = require('./routes/Teams.js');
const webhookRoutes = require('./webhooks/webhookHandler');

const app = express();

// Middleware
const allowedOrigins = [process.env.ORIGIN, 'http://localhost:3000']; // Add localhost to allowed origins

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true, // Allow credentials (if using cookies or auth headers)
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ type: req => !req.originalUrl.startsWith('/api/webhooks') }));

// Root path route
app.get('/', (req, res) => {
  res.send('Welcome to the Consensus Check API!');
});

// Routes
app.use('/api/documents', documentRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/user', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/webhooks', webhookRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    propCheckExpiredScheduler();
    app.listen(process.env.PORT || 3000, () => {
      console.log('Connected to db & listening on port', process.env.PORT);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });
