require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const propCheckExpiredScheduler = require('./utils/Scheduler.js');
const documentRoutes = require('./routes/Documents.js');
const proposalRoutes = require('./routes/Proposals');
const userRoutes = require('./routes/Users');
const teamRoutes = require('./routes/Teams.js');
const webhookRoutes = require('./webhooks/webhookHandler');
// const { Server } = require('socket.io');

const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin:'*',
//     method: ['GET', 'POST'],
//   },
// });
app.use(cors());
app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));

// Use JSON middleware globally, but not for webhooks
app.use(express.json({ type: req => !req.originalUrl.startsWith('/api/webhooks') }));

// Root path route
app.get('/', (req, res) => {
  res.send('Welcome to the Consensus Check API!');
});

// routes
app.use('./api/documents', documentRoutes );
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



  