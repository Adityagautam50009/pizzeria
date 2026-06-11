const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, getAllUsers } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/users', protect, adminOnly, getAllUsers);

module.exports = router;
