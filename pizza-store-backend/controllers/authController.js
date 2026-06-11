const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper to generate JWT token
function generateToken(id) {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/register
function register(req, res) {
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  var phone = req.body.phone;
  var address = req.body.address;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  User.findOne({ email: email }).then(function(existingUser) {
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    var salt = bcrypt.genSaltSync(10);
    var hashedPassword = bcrypt.hashSync(password, salt);

    var newUser = new User({
      name: name,
      email: email,
      password: hashedPassword,
      phone: phone || '',
      address: address || '',
      role: 'customer'
    });

    newUser.save().then(function(user) {
      res.status(201).json({
        message: 'Registration successful',
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }).catch(function(err) {
      res.status(500).json({ message: 'Error saving user', error: err.message });
    });
  }).catch(function(err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  });
}

// POST /api/auth/login
function login(req, res) {
  var email = req.body.email;
  var password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  User.findOne({ email: email }).then(function(user) {
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    var isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  }).catch(function(err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  });
}

// GET /api/auth/profile  (protected)
function getProfile(req, res) {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    address: req.user.address,
    role: req.user.role
  });
}

// PUT /api/auth/profile  (protected)
function updateProfile(req, res) {
  User.findById(req.user._id).then(function(user) {
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;

    if (req.body.password) {
      var salt = bcrypt.genSaltSync(10);
      user.password = bcrypt.hashSync(req.body.password, salt);
    }

    user.save().then(function(updated) {
      res.json({
        message: 'Profile updated',
        user: {
          id: updated._id,
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
          address: updated.address,
          role: updated.role
        }
      });
    });
  }).catch(function(err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  });
}

// GET /api/auth/users  (admin only)
function getAllUsers(req, res) {
  User.find({ role: 'customer' }).select('-password').then(function(users) {
    res.json(users);
  }).catch(function(err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  });
}

module.exports = { register, login, getProfile, updateProfile, getAllUsers };
