// tests/orders.test.js
// =============================================================================
// ORDER TESTS
// =============================================================================
// Tests for:
//   POST   /api/orders              — Customer places an order
//   GET    /api/orders              — Get orders (all for admin, own for customer)
//   GET    /api/orders/:id          — Get a single order
//   PUT    /api/orders/:id/cancel   — Customer cancels a pending order
//   PUT    /api/orders/:id/status   — Admin updates order status + message
//   GET    /api/orders/:id/bill     — Get itemised bill with GST
// =============================================================================

const request = require('supertest');
const app     = require('../app');
const { createCustomer, createAdmin, createMenuItem, placeOrder } = require('./helpers');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders — Place Order
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/orders — Place an Order', function () {

  test('customer should be able to place an order', async function () {
    var { token } = await createCustomer();
    var item = await createMenuItem({ name: 'Margherita', price: 199 });

    var res = await placeOrder(token, item._id.toString());

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body.order).toHaveProperty('status', 'pending');
    expect(res.body.order).toHaveProperty('totalAmount', 199); // 1 × 199
  });

  test('total amount should multiply price by quantity correctly', async function () {
    var { token } = await createCustomer();
    var item = await createMenuItem({ price: 100 });

    var res = await placeOrder(token, item._id.toString(), {
      items: [{ menuItem: item._id.toString(), quantity: 3 }]
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.order.totalAmount).toBe(300); // 3 × 100
  });

  test('order with multiple different items should total correctly', async function () {
    var { token } = await createCustomer();
    var pizza = await createMenuItem({ price: 200 });
    var side  = await createMenuItem({ price: 80, category: 'sides' });

    var res = await placeOrder(token, pizza._id.toString(), {
      items: [
        { menuItem: pizza._id.toString(), quantity: 2 },  // 2 × 200 = 400
        { menuItem: side._id.toString(),  quantity: 1 }   // 1 × 80  = 80
      ]                                                   // total   = 480
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.order.totalAmount).toBe(480);
  });

  test('new order should always start with status "pending"', async function () {
    var { token } = await createCustomer();
    var item = await createMenuItem();

    var res = await placeOrder(token, item._id.toString());

    expect(res.body.order.status).toBe('pending');
  });

  // ❌ Cannot order an unavailable item
  test('should return 400 when ordering an unavailable item', async function () {
    var { token } = await createCustomer();
    var item = await createMenuItem({ isAvailable: false }); // item is sold out

    var res = await placeOrder(token, item._id.toString());

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/unavailable/i);
  });

  // ❌ Cannot order a non-existent item
  test('should return 400 for a fake/non-existent menu item ID', async function () {
    var { token } = await createCustomer();

    var res = await placeOrder(token, '64abcdef1234567890abcdef');

    expect(res.statusCode).toBe(400);
  });

  // ❌ Cannot order with empty items array
  test('should return 400 if items array is empty', async function () {
    var { token } = await createCustomer();

    var res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer ' + token)
      .send({ items: [], deliveryMode: 'delivery', deliveryAddress: 'Test', paymentMode: 'cash' });

    expect(res.statusCode).toBe(400);
  });

  // ❌ Must be logged in
  test('should return 401 if not logged in', async function () {
    var item = await createMenuItem();

    var res = await request(app)
      .post('/api/orders')
      .send({ items: [{ menuItem: item._id.toString(), quantity: 1 }] });

    expect(res.statusCode).toBe(401);
  });

  // ✅ Delivery and payment options should be stored
  test('should store delivery mode and payment mode on the order', async function () {
    var { token } = await createCustomer();
    var item = await createMenuItem();

    var res = await placeOrder(token, item._id.toString(), {
      items:           [{ menuItem: item._id.toString(), quantity: 1 }],
      deliveryMode:    'pickup',
      paymentMode:     'upi'
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.order.deliveryMode).toBe('pickup');
    expect(res.body.order.paymentMode).toBe('upi');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders — Get Orders
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/orders — Get Orders', function () {

  test('admin should see ALL orders from all customers', async function () {
    // Two different customers place orders
    var c1   = await createCustomer({ email: 'c1@test.com' });
    var c2   = await createCustomer({ email: 'c2@test.com' });
    var item = await createMenuItem();

    await placeOrder(c1.token, item._id.toString());
    await placeOrder(c2.token, item._id.toString());

    var { token: adminToken } = await createAdmin();

    var res = await request(app)
      .get('/api/orders')
      .set('Authorization', 'Bearer ' + adminToken);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2); // admin sees both
  });

  test('customer should only see their OWN orders', async function () {
    var c1   = await createCustomer({ email: 'mine@test.com' });
    var c2   = await createCustomer({ email: 'theirs@test.com' });
    var item = await createMenuItem();

    // c1 places 2 orders, c2 places 1 order
    await placeOrder(c1.token, item._id.toString());
    await placeOrder(c1.token, item._id.toString());
    await placeOrder(c2.token, item._id.toString());

    var res = await request(app)
      .get('/api/orders')
      .set('Authorization', 'Bearer ' + c1.token);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2); // c1 sees only their 2 orders
  });

  test('should return 401 if not logged in', async function () {
    var res = await request(app).get('/api/orders');
    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/:id — Get Single Order
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/orders/:id — Get Single Order', function () {

  test('customer should be able to get their own order by ID', async function () {
    var { token } = await createCustomer();
    var item = await createMenuItem();
    var orderRes = await placeOrder(token, item._id.toString());
    var orderId  = orderRes.body.order._id;

    var res = await request(app)
      .get('/api/orders/' + orderId)
      .set('Authorization', 'Bearer ' + token);

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(orderId);
  });

  test('customer should NOT be able to get another customer\'s order', async function () {
    var c1   = await createCustomer({ email: 'owner@test.com' });
    var c2   = await createCustomer({ email: 'spy@test.com' });
    var item = await createMenuItem();

    var orderRes = await placeOrder(c1.token, item._id.toString());
    var orderId  = orderRes.body.order._id;

    // c2 tries to read c1's order
    var res = await request(app)
      .get('/api/orders/' + orderId)
      .set('Authorization', 'Bearer ' + c2.token);

    expect(res.statusCode).toBe(403);
  });

  test('admin can read any customer\'s order', async function () {
    var { token: custToken } = await createCustomer();
    var item = await createMenuItem();
    var orderRes = await placeOrder(custToken, item._id.toString());
    var orderId  = orderRes.body.order._id;

    var { token: adminToken } = await createAdmin();

    var res = await request(app)
      .get('/api/orders/' + orderId)
      .set('Authorization', 'Bearer ' + adminToken);

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(orderId);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/orders/:id/cancel — Cancel Order
// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/orders/:id/cancel — Cancel Order', function () {

  test('customer should be able to cancel a pending order', async function () {
    var { token } = await createCustomer();
    var item = await createMenuItem();
    var orderRes = await placeOrder(token, item._id.toString());
    var orderId  = orderRes.body.order._id;

    var res = await request(app)
      .put('/api/orders/' + orderId + '/cancel')
      .set('Authorization', 'Bearer ' + token);

    expect(res.statusCode).toBe(200);
    expect(res.body.order.status).toBe('cancelled');
  });

  test('customer should NOT be able to cancel someone else\'s order', async function () {
    var c1   = await createCustomer({ email: 'owner2@test.com' });
    var c2   = await createCustomer({ email: 'thief@test.com' });
    var item = await createMenuItem();

    var orderRes = await placeOrder(c1.token, item._id.toString());
    var orderId  = orderRes.body.order._id;

    var res = await request(app)
      .put('/api/orders/' + orderId + '/cancel')
      .set('Authorization', 'Bearer ' + c2.token);

    expect(res.statusCode).toBe(403);
  });

  test('should NOT cancel an already accepted order', async function () {
    var { token: custToken } = await createCustomer();
    var item = await createMenuItem();
    var orderRes = await placeOrder(custToken, item._id.toString());
    var orderId  = orderRes.body.order._id;

    // Admin accepts the order first
    var { token: adminToken } = await createAdmin();
    await request(app)
      .put('/api/orders/' + orderId + '/status')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ status: 'accepted' });

    // Now customer tries to cancel the accepted order
    var res = await request(app)
      .put('/api/orders/' + orderId + '/cancel')
      .set('Authorization', 'Bearer ' + custToken);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/pending/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/orders/:id/status — Admin Updates Order Status
// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/orders/:id/status — Admin Update Status', function () {

  test('admin should be able to accept a pending order', async function () {
    var { token: custToken } = await createCustomer();
    var item = await createMenuItem();
    var orderRes = await placeOrder(custToken, item._id.toString());
    var orderId  = orderRes.body.order._id;

    var { token: adminToken } = await createAdmin();

    var res = await request(app)
      .put('/api/orders/' + orderId + '/status')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ status: 'accepted', statusMessage: 'Your pizza is being prepared!' });

    expect(res.statusCode).toBe(200);
    expect(res.body.order.status).toBe('accepted');
    expect(res.body.order.statusMessage).toBe('Your pizza is being prepared!');
  });

  test('admin should be able to reject an order', async function () {
    var { token: custToken } = await createCustomer();
    var item = await createMenuItem();
    var orderRes = await placeOrder(custToken, item._id.toString());
    var orderId  = orderRes.body.order._id;

    var { token: adminToken } = await createAdmin();

    var res = await request(app)
      .put('/api/orders/' + orderId + '/status')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ status: 'rejected', statusMessage: 'Sorry, this item is out of stock.' });

    expect(res.statusCode).toBe(200);
    expect(res.body.order.status).toBe('rejected');
  });

  test('admin should be able to mark an order as delivered', async function () {
    var { token: custToken } = await createCustomer();
    var item = await createMenuItem();
    var orderRes = await placeOrder(custToken, item._id.toString());
    var orderId  = orderRes.body.order._id;

    var { token: adminToken } = await createAdmin();

    // Accept it first
    await request(app)
      .put('/api/orders/' + orderId + '/status')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ status: 'accepted' });

    // Then deliver it
    var res = await request(app)
      .put('/api/orders/' + orderId + '/status')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ status: 'delivered' });

    expect(res.statusCode).toBe(200);
    expect(res.body.order.status).toBe('delivered');
    expect(res.body.order.isPaid).toBe(true); // isPaid should be set to true on delivery
  });

  test('should return 400 for an invalid status like "cooked"', async function () {
    var { token: custToken } = await createCustomer();
    var item = await createMenuItem();
    var orderRes = await placeOrder(custToken, item._id.toString());
    var orderId  = orderRes.body.order._id;

    var { token: adminToken } = await createAdmin();

    var res = await request(app)
      .put('/api/orders/' + orderId + '/status')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ status: 'cooked' }); // not a valid status

    expect(res.statusCode).toBe(400);
  });

  test('should return 400 if admin tries to set status back to "pending"', async function () {
    var { token: custToken } = await createCustomer();
    var item = await createMenuItem();
    var orderRes = await placeOrder(custToken, item._id.toString());
    var orderId  = orderRes.body.order._id;

    var { token: adminToken } = await createAdmin();

    var res = await request(app)
      .put('/api/orders/' + orderId + '/status')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ status: 'pending' }); // admin cannot set pending

    expect(res.statusCode).toBe(400);
  });

  test('should return 403 if a customer tries to update order status', async function () {
    var { token: custToken } = await createCustomer();
    var item = await createMenuItem();
    var orderRes = await placeOrder(custToken, item._id.toString());
    var orderId  = orderRes.body.order._id;

    // Customer tries to accept their own order
    var res = await request(app)
      .put('/api/orders/' + orderId + '/status')
      .set('Authorization', 'Bearer ' + custToken)
      .send({ status: 'accepted' });

    expect(res.statusCode).toBe(403);
  });

  test('status message defaults should be set when no message is provided', async function () {
    var { token: custToken } = await createCustomer();
    var item = await createMenuItem();
    var orderRes = await placeOrder(custToken, item._id.toString());
    var orderId  = orderRes.body.order._id;

    var { token: adminToken } = await createAdmin();

    // Accept without a message — a default message should be set
    var res = await request(app)
      .put('/api/orders/' + orderId + '/status')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ status: 'accepted' }); // no statusMessage

    expect(res.statusCode).toBe(200);
    expect(res.body.order.statusMessage).toBeTruthy(); // some message must be present
    expect(typeof res.body.order.statusMessage).toBe('string');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/:id/bill — Get Bill
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/orders/:id/bill — Get Order Bill', function () {

  test('customer should be able to get their own bill', async function () {
    var { token } = await createCustomer();
    var item = await createMenuItem({ price: 200 });
    var orderRes = await placeOrder(token, item._id.toString());
    var orderId  = orderRes.body.order._id;

    var res = await request(app)
      .get('/api/orders/' + orderId + '/bill')
      .set('Authorization', 'Bearer ' + token);

    expect(res.statusCode).toBe(200);

    // Bill structure check
    expect(res.body).toHaveProperty('billNumber');
    expect(res.body).toHaveProperty('subtotal', 200);
    expect(res.body).toHaveProperty('tax');
    expect(res.body).toHaveProperty('grandTotal');

    // Tax should be 5% of subtotal
    expect(res.body.tax).toBe(10);             // 5% of 200
    expect(res.body.grandTotal).toBe(210);     // 200 + 10
  });

  test('bill number should follow the "BILL-XXXXXX" format', async function () {
    var { token } = await createCustomer();
    var item = await createMenuItem();
    var orderRes = await placeOrder(token, item._id.toString());
    var orderId  = orderRes.body.order._id;

    var res = await request(app)
      .get('/api/orders/' + orderId + '/bill')
      .set('Authorization', 'Bearer ' + token);

    expect(res.body.billNumber).toMatch(/^BILL-/);
  });

  test('bill should contain item-level details with subtotals', async function () {
    var { token } = await createCustomer();
    var item = await createMenuItem({ price: 100 });
    var orderRes = await placeOrder(token, item._id.toString(), {
      items: [{ menuItem: item._id.toString(), quantity: 2 }]
    });
    var orderId = orderRes.body.order._id;

    var res = await request(app)
      .get('/api/orders/' + orderId + '/bill')
      .set('Authorization', 'Bearer ' + token);

    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].quantity).toBe(2);
    expect(res.body.items[0].subtotal).toBe(200); // 2 × 100
  });

  test('admin should be able to get the bill for any order', async function () {
    var { token: custToken } = await createCustomer();
    var item = await createMenuItem({ price: 100 });
    var orderRes = await placeOrder(custToken, item._id.toString());
    var orderId  = orderRes.body.order._id;

    var { token: adminToken } = await createAdmin();

    var res = await request(app)
      .get('/api/orders/' + orderId + '/bill')
      .set('Authorization', 'Bearer ' + adminToken);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('grandTotal');
  });

  test('customer should NOT be able to get another customer\'s bill', async function () {
    var c1   = await createCustomer({ email: 'billowner@test.com' });
    var c2   = await createCustomer({ email: 'billspy@test.com' });
    var item = await createMenuItem();

    var orderRes = await placeOrder(c1.token, item._id.toString());
    var orderId  = orderRes.body.order._id;

    var res = await request(app)
      .get('/api/orders/' + orderId + '/bill')
      .set('Authorization', 'Bearer ' + c2.token);

    expect(res.statusCode).toBe(403);
  });
});
