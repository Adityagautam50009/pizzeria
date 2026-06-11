const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
function protect(req, res, next) {
  var token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    var decoded = jwt.verify(token, process.env.JWT_SECRET);
    User.findById(decoded.id).select('-password').then(function(user) {
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      req.user = user;
      next();
    });
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
}

// Only allow admin role
function adminOnly(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admins only.' });
  }
}

module.exports = { protect, adminOnly };
