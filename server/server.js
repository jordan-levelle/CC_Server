require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const propCheckExpiredScheduler = require('./utils/Scheduler.js');
const proposalRoutes = require('./routes/Proposals');
const userRoutes = require('./routes/Users');
const teamRoutes = require('./routes/Teams.js');
const webhookRoutes = require('./webhooks/webhookHandler');


// express app
const app = express();

// Enable CORS
app.use(cors());

// Use JSON middleware globally, but not for webhooks
app.use(express.json({ type: req => !req.originalUrl.startsWith('/api/webhooks') }));

// Root path route
app.get('/', (req, res) => {
  res.send('Welcome to the Consensus Check API!');
});

// routes
app.use('/api/proposals', proposalRoutes);
app.use('/api/user', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/webhooks', webhookRoutes);

// connect to db
mongoose.connect(process.env.MONGO_URI)
  .then(() => {

    propCheckExpiredScheduler();
    app.listen(process.env.PORT || 3000, () => {
      console.log('connected to db & listening on port', process.env.PORT)
    })
  })
  .catch((error) => {
    console.log(error)
  });



  