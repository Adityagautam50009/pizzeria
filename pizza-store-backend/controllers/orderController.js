const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

// POST /api/orders  — customer places an order
function placeOrder(req, res) {
  var items = req.body.items;
  var deliveryMode = req.body.deliveryMode;
  var deliveryAddress = req.body.deliveryAddress;
  var paymentMode = req.body.paymentMode;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Order must have at least one item' });
  }

  // Fetch all menu items to verify prices
  var itemIds = [];
  for (var i = 0; i < items.length; i++) {
    itemIds.push(items[i].menuItem);
  }

  MenuItem.find({ _id: { $in: itemIds } }).then(function(menuItems) {
    var orderItems = [];
    var totalAmount = 0;

    for (var i = 0; i < items.length; i++) {
      var found = null;
      for (var j = 0; j < menuItems.length; j++) {
        if (menuItems[j]._id.toString() === items[i].menuItem) {
          found = menuItems[j];
          break;
        }
      }

      if (!found) {
        return res.status(400).json({ message: 'Invalid menu item: ' + items[i].menuItem });
      }

      if (!found.isAvailable) {
        return res.status(400).json({ message: found.name + ' is currently unavailable' });
      }

      var qty = items[i].quantity || 1;
      orderItems.push({
        menuItem: found._id,
        name: found.name,
        price: found.price,
        quantity: qty
      });
      totalAmount += found.price * qty;
    }

    var newOrder = new Order({
      customer: req.user._id,
      items: orderItems,
      totalAmount: totalAmount,
      deliveryMode: deliveryMode || 'delivery',
      deliveryAddress: deliveryAddress || '',
      paymentMode: paymentMode || 'cash',
      status: 'pending',
      statusMessage: 'Your order has been placed and is waiting for confirmation.'
    });

    newOrder.save().then(function(order) {
      res.status(201).json({ message: 'Order placed successfully', order: order });
    });
  }).catch(function(err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  });
}

// GET /api/orders  — admin sees all orders, customer sees their own
function getOrders(req, res) {
  var filter = {};

  if (req.user.role !== 'admin') {
    filter.customer = req.user._id;
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  Order.find(filter)
    .populate('customer', 'name email phone')
    .populate('items.menuItem', 'name price category')
    .sort({ createdAt: -1 })
    .then(function(orders) {
      res.json(orders);
    }).catch(function(err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    });
}

// GET /api/orders/:id
function getOrderById(req, res) {
  Order.findById(req.params.id)
    .populate('customer', 'name email phone address')
    .populate('items.menuItem', 'name price category')
    .then(function(order) {
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Customer can only see their own order
      if (req.user.role !== 'admin' && order.customer._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json(order);
    }).catch(function(err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    });
}

// PUT /api/orders/:id/cancel  — customer cancels their own pending order
function cancelOrder(req, res) {
  Order.findById(req.params.id).then(function(order) {
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending orders can be cancelled' });
    }

    order.status = 'cancelled';
    order.statusMessage = 'Your order has been cancelled.';

    order.save().then(function(updated) {
      res.json({ message: 'Order cancelled', order: updated });
    });
  }).catch(function(err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  });
}

// PUT /api/orders/:id/status  — admin accepts, rejects, or delivers order
function updateOrderStatus(req, res) {
  var status = req.body.status;
  var statusMessage = req.body.statusMessage;

  var validStatuses = ['accepted', 'rejected', 'delivered'];
  if (!status || validStatuses.indexOf(status) === -1) {
    return res.status(400).json({ message: 'Status must be accepted, rejected, or delivered' });
  }

  Order.findById(req.params.id).then(function(order) {
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;

    // Default messages per status if admin doesn't provide one
    if (statusMessage) {
      order.statusMessage = statusMessage;
    } else if (status === 'accepted') {
      order.statusMessage = 'Your order has been accepted! It is being prepared.';
    } else if (status === 'rejected') {
      order.statusMessage = 'Sorry, your order has been rejected. Please contact us for more information.';
    } else if (status === 'delivered') {
      order.statusMessage = 'Your order has been delivered. Enjoy your meal!';
      order.isPaid = true;
    }

    order.save().then(function(updated) {
      res.json({ message: 'Order status updated', order: updated });
    });
  }).catch(function(err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  });
}

// GET /api/orders/:id/bill  — generate bill for a specific order
function getBill(req, res) {
  Order.findById(req.params.id)
    .populate('customer', 'name email phone address')
    .populate('items.menuItem', 'name price category')
    .then(function(order) {
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Customer can only see their own bill
      if (req.user.role !== 'admin' && order.customer._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      var tax = parseFloat((order.totalAmount * 0.05).toFixed(2)); // 5% GST
      var grandTotal = parseFloat((order.totalAmount + tax).toFixed(2));

      var billItems = [];
      for (var i = 0; i < order.items.length; i++) {
        var item = order.items[i];
        billItems.push({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        });
      }

      res.json({
        billNumber: 'BILL-' + order._id.toString().slice(-6).toUpperCase(),
        customer: order.customer,
        items: billItems,
        subtotal: order.totalAmount,
        tax: tax,
        grandTotal: grandTotal,
        paymentMode: order.paymentMode,
        deliveryMode: order.deliveryMode,
        orderStatus: order.status,
        orderedAt: order.createdAt
      });
    }).catch(function(err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    });
}

module.exports = { placeOrder, getOrders, getOrderById, cancelOrder, updateOrderStatus, getBill };
