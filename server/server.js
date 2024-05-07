require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const proposalRoutes = require('./routes/Proposals');
const userRoutes = require('./routes/Users');
const emailRoutes = require('./routes/Emails');


// express app
const app = express();

// middleware
app.use(express.json());

// Enable CORS
app.use(cors());

app.use((req, res, next) => {
  console.log(req.path, req.method)
  next()
});

// routes
app.use('/api/proposals', proposalRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/user', userRoutes);

// connect to db
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    // listen for requests
    app.listen(process.env.PORT || 3000, () => {
      console.log('connected to db & listening on port', process.env.PORT)
    })
  })
  .catch((error) => {
    console.log(error)
  });