const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['pizza', 'sides', 'beverages', 'combo', 'new launches', 'bestsellers']
  },
  image: {
    type: String,
    default: ''
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large', 'regular', 'N/A'],
    default: 'N/A'
  }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
