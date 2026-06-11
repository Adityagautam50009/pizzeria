const express = require('express');
const router = express.Router();
const { getMonthlyRevenue, getSummary } = require('../controllers/revenueController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/monthly', protect, adminOnly, getMonthlyRevenue);
router.get('/summary', protect, adminOnly, getSummary);

module.exports = router;
