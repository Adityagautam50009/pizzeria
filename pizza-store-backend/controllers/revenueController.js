const Order = require('../models/Order');

// GET /api/revenue/monthly?year=2024
function getMonthlyRevenue(req, res) {
  var year = parseInt(req.query.year) || new Date().getFullYear();

  Order.find({
    status: { $in: ['delivered'] },
    createdAt: {
      $gte: new Date(year + '-01-01'),
      $lte: new Date(year + '-12-31')
    }
  }).then(function(orders) {

    // Build monthly totals array (index 0 = Jan, 11 = Dec)
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var monthly = [];
    for (var m = 0; m < 12; m++) {
      monthly.push({ month: months[m], revenue: 0, orderCount: 0 });
    }

    for (var i = 0; i < orders.length; i++) {
      var monthIndex = new Date(orders[i].createdAt).getMonth();
      monthly[monthIndex].revenue += orders[i].totalAmount;
      monthly[monthIndex].orderCount += 1;
    }

    // Round revenue values
    for (var j = 0; j < monthly.length; j++) {
      monthly[j].revenue = parseFloat(monthly[j].revenue.toFixed(2));
    }

    var totalRevenue = 0;
    for (var k = 0; k < orders.length; k++) {
      totalRevenue += orders[k].totalAmount;
    }

    res.json({
      year: year,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders: orders.length,
      monthly: monthly
    });
  }).catch(function(err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  });
}

// GET /api/revenue/summary  — quick overall stats for admin dashboard
function getSummary(req, res) {
  var totalRevenue = 0;
  var totalOrders = 0;
  var pendingOrders = 0;

  Order.find({}).then(function(allOrders) {
    totalOrders = allOrders.length;

    for (var i = 0; i < allOrders.length; i++) {
      if (allOrders[i].status === 'delivered') {
        totalRevenue += allOrders[i].totalAmount;
      }
      if (allOrders[i].status === 'pending') {
        pendingOrders += 1;
      }
    }

    res.json({
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders: totalOrders,
      pendingOrders: pendingOrders
    });
  }).catch(function(err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  });
}

module.exports = { getMonthlyRevenue, getSummary };
