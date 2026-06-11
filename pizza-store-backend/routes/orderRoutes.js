const express = require('express');
const router = express.Router();
const { placeOrder, getOrders, getOrderById, cancelOrder, updateOrderStatus, getBill } = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, placeOrder);                                    // Customer places order
router.get('/', protect, getOrders);                                      // Admin: all orders | Customer: own orders
router.get('/:id', protect, getOrderById);                                // Get single order
router.put('/:id/cancel', protect, cancelOrder);                          // Customer cancels order
router.put('/:id/status', protect, adminOnly, updateOrderStatus);         // Admin updates status
router.get('/:id/bill', protect, getBill);                                // Get bill for order

module.exports = router;
