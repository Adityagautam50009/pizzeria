// tests/revenue.test.js
// =============================================================================
// REVENUE TESTS
// =============================================================================
// Tests for:
//   GET  /api/revenue/summary  — Admin: total revenue, orders, pending count
//   GET  /api/revenue/monthly  — Admin: monthly revenue breakdown for a year
// =============================================================================

const request = require('supertest');
const Order   = require('../models/Order');
const app     = require('../app');
const { createCustomer, createAdmin, createMenuItem, placeOrder } = require('./helpers');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: mark an order as "delivered" (makes it count as revenue)
// ─────────────────────────────────────────────────────────────────────────────
async function deliverOrder(orderId, adminToken) {
  return request(app)
    .put('/api/orders/' + orderId + '/status')
    .set('Authorization', 'Bearer ' + adminToken)
    .send({ status: 'delivered' });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/revenue/summary
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/revenue/summary — Revenue Summary', function () {

  test('admin should get summary with totalRevenue, totalOrders, pendingOrders', async function () {
    var { token: adminToken } = await createAdmin();

    var res = await request(app)
      .get('/api/revenue/summary')
      .set('Authorization', 'Bearer ' + adminToken);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('totalRevenue');
    expect(res.body).toHaveProperty('totalOrders');
    expect(res.body).toHaveProperty('pendingOrders');
  });

  test('totalRevenue should be 0 when no orders have been delivered yet', async function () {
    var { token: adminToken } = await createAdmin();

    var res = await request(app)
      .get('/api/revenue/summary')
      .set('Authorization', 'Bearer ' + adminToken);

    expect(res.body.totalRevenue).toBe(0);
    expect(res.body.totalOrders).toBe(0);
  });

  test('totalRevenue should only count delivered orders (not pending or cancelled)', async function () {
    var { token: custToken } = await createCustomer();
    var { token: adminToken } = await createAdmin();
    var item = await createMenuItem({ price: 500 });

    // Place 3 orders
    var o1 = await placeOrder(custToken, item._id.toString());
    var o2 = await placeOrder(custToken, item._id.toString());
    var o3 = await placeOrder(custToken, item._id.toString());

    // Deliver only 1 order (revenue should be 500, not 1500)
    await deliverOrder(o1.body.order._id, adminToken);
    // o2 stays pending, o3 stays pending

    var res = await request(app)
      .get('/api/revenue/summary')
      .set('Authorization', 'Bearer ' + adminToken);

    expect(res.body.totalRevenue).toBe(500); // only delivered order counts
  });

  test('pendingOrders count should reflect how many orders are still waiting', async function () {
    var { token: custToken } = await createCustomer();
    var { token: adminToken } = await createAdmin();
    var item = await createMenuItem({ price: 100 });

    await placeOrder(custToken, item._id.toString()); // pending
    await placeOrder(custToken, item._id.toString()); // pending
    var o3 = await placeOrder(custToken, item._id.toString()); // will be accepted

    await request(app)
      .put('/api/orders/' + o3.body.order._id + '/status')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ status: 'accepted' });

    var res = await request(app)
      .get('/api/revenue/summary')
      .set('Authorization', 'Bearer ' + adminToken);

    expect(res.body.pendingOrders).toBe(2); // only 2 are still pending
    expect(res.body.totalOrders).toBe(3);   // all 3 were placed
  });

  test('totalRevenue should sum across multiple delivered orders', async function () {
    var { token: custToken } = await createCustomer();
    var { token: adminToken } = await createAdmin();
    var item = await createMenuItem({ price: 200 });

    var o1 = await placeOrder(custToken, item._id.toString());
    var o2 = await placeOrder(custToken, item._id.toString());

    await deliverOrder(o1.body.order._id, adminToken);
    await deliverOrder(o2.body.order._id, adminToken);

    var res = await request(app)
      .get('/api/revenue/summary')
      .set('Authorization', 'Bearer ' + adminToken);

    expect(res.body.totalRevenue).toBe(400); // 200 + 200
  });

  // ❌ Access control
  test('should return 403 if a customer tries to access revenue summary', async function () {
    var { token: custToken } = await createCustomer();

    var res = await request(app)
      .get('/api/revenue/summary')
      .set('Authorization', 'Bearer ' + custToken);

    expect(res.statusCode).toBe(403);
  });

  test('should return 401 if no token is provided', async function () {
    var res = await request(app).get('/api/revenue/summary');
    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/revenue/monthly
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/revenue/monthly — Monthly Revenue Breakdown', function () {

  test('should return an array of 12 months', async function () {
    var { token } = await createAdmin();

    var res = await request(app)
      .get('/api/revenue/monthly')
      .set('Authorization', 'Bearer ' + token);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('monthly');
    expect(res.body.monthly.length).toBe(12); // one entry per month
  });

  test('each month should have a name, revenue, and orderCount', async function () {
    var { token } = await createAdmin();

    var res = await request(app)
      .get('/api/revenue/monthly')
      .set('Authorization', 'Bearer ' + token);

    var jan = res.body.monthly[0];
    expect(jan).toHaveProperty('month');
    expect(jan).toHaveProperty('revenue');
    expect(jan).toHaveProperty('orderCount');
  });

  test('all months should start at 0 when there are no delivered orders', async function () {
    var { token } = await createAdmin();

    var res = await request(app)
      .get('/api/revenue/monthly')
      .set('Authorization', 'Bearer ' + token);

    res.body.monthly.forEach(function (m) {
      expect(m.revenue).toBe(0);
      expect(m.orderCount).toBe(0);
    });
  });

  test('should return year in the response', async function () {
    var { token } = await createAdmin();
    var currentYear = new Date().getFullYear();

    var res = await request(app)
      .get('/api/revenue/monthly')
      .set('Authorization', 'Bearer ' + token);

    expect(res.body).toHaveProperty('year', currentYear);
  });

  test('should accept a custom ?year= parameter', async function () {
    var { token } = await createAdmin();

    var res = await request(app)
      .get('/api/revenue/monthly?year=2023')
      .set('Authorization', 'Bearer ' + token);

    expect(res.statusCode).toBe(200);
    expect(res.body.year).toBe(2023);
    expect(res.body.monthly.length).toBe(12);
  });

  test('monthly revenue should count only delivered orders', async function () {
    var { token: custToken } = await createCustomer();
    var { token: adminToken } = await createAdmin();
    var item = await createMenuItem({ price: 300 });

    var o1 = await placeOrder(custToken, item._id.toString()); // will be delivered
    var o2 = await placeOrder(custToken, item._id.toString()); // stays pending (no revenue)

    await deliverOrder(o1.body.order._id, adminToken);

    var currentYear = new Date().getFullYear();

    var res = await request(app)
      .get('/api/revenue/monthly?year=' + currentYear)
      .set('Authorization', 'Bearer ' + adminToken);

    // Total revenue across all months should be 300 (only 1 delivered order)
    var totalRevenue = res.body.monthly.reduce(function (sum, m) { return sum + m.revenue; }, 0);
    expect(totalRevenue).toBe(300);
  });

  // ❌ Access control
  test('should return 403 if a customer tries to access monthly revenue', async function () {
    var { token } = await createCustomer();

    var res = await request(app)
      .get('/api/revenue/monthly')
      .set('Authorization', 'Bearer ' + token);

    expect(res.statusCode).toBe(403);
  });

  test('should return 401 if no token is provided', async function () {
    var res = await request(app).get('/api/revenue/monthly');
    expect(res.statusCode).toBe(401);
  });
});
