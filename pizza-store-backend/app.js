// app.js — Express app setup (without starting the server)
// This file is used by BOTH server.js (to start the real server)
// and by the test files (to test routes without starting a real server)

const express = require('express');
const cors    = require('cors');

const authRoutes    = require('./routes/authRoutes');
const menuRoutes    = require('./routes/menuRoutes');
const orderRoutes   = require('./routes/orderRoutes');
const revenueRoutes = require('./routes/revenueRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth',    authRoutes);
app.use('/api/menu',    menuRoutes);
app.use('/api/orders',  orderRoutes);
app.use('/api/revenue', revenueRoutes);

app.get('/', function(req, res) {
  res.json({ message: 'Pizza Store API is running' });
});

module.exports = app;
