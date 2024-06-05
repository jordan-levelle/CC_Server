require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const proposalRoutes = require('./routes/Proposals');
const userRoutes = require('./routes/Users');


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

// Root path route
app.get('/', (req, res) => {
  res.send('Welcome to the Consensus Check API!');
});

// routes
app.use('/api/proposals', proposalRoutes);
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
