// server.js — starts the actual HTTP server
// The Express app config lives in app.js (so tests can import it without starting the server)
const mongoose = require('mongoose');
require('dotenv').config();

const app = require('./app');

mongoose.connect(process.env.MONGO_URI)
  .then(function () {
    console.log('MongoDB connected');
    app.listen(process.env.PORT, function () {
      console.log('Server running on port ' + process.env.PORT);
    });
  })
  .catch(function (err) {
    console.log('MongoDB connection error:', err.message);
  });
