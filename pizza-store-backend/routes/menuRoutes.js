const express = require('express');
const router = express.Router();
const { getAllItems, getItemById, createItem, updateItem, deleteItem } = require('../controllers/menuController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', getAllItems);                              // Public — anyone can see menu
router.get('/:id', getItemById);                          // Public
router.post('/', protect, adminOnly, createItem);         // Admin only
router.put('/:id', protect, adminOnly, updateItem);       // Admin only
router.delete('/:id', protect, adminOnly, deleteItem);    // Admin only

module.exports = router;
