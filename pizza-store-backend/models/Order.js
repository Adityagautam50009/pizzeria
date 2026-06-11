const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: { type: String },
  price: { type: Number },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled', 'delivered'],
    default: 'pending'
  },
  statusMessage: {
    type: String,
    default: ''
  },
  deliveryMode: {
    type: String,
    enum: ['delivery', 'pickup'],
    default: 'delivery'
  },
  deliveryAddress: {
    type: String,
    trim: true
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'card', 'upi'],
    default: 'cash'
  },
  isPaid: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
