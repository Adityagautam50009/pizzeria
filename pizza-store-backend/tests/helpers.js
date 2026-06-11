// tests/helpers.js
// =============================================================================
// SHARED HELPER FUNCTIONS FOR TESTS
// =============================================================================
// These functions are used across multiple test files to avoid repeating
// the same setup code (creating users, getting tokens, creating menu items).
//
// Think of helpers like a "before the test" toolkit.
// =============================================================================

const request  = require('supertest');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
const MenuItem = require('../models/MenuItem');
const app      = require('../app');

// =============================================================================
// USER HELPERS
// =============================================================================

/**
 * createCustomer()
 * Creates a real customer account in the test database and returns the token + user.
 * Use this in tests that need a logged-in customer.
 */
async function createCustomer(overrides) {
  var data = Object.assign({
    name:     'Test Customer',
    email:    'customer@test.com',
    password: 'Test@123',
    phone:    '9876543210',
    address:  '123 Test Street'
  }, overrides);

  var res = await request(app)
    .post('/api/auth/register')
    .send(data);

  return {
    token: res.body.token,          // JWT — attach to protected requests
    user:  res.body.user,           // { id, name, email, role }
    id:    res.body.user.id
  };
}

/**
 * createAdmin()
 * Creates an admin account directly in the database (bypassing the register route
 * which always creates customers) and logs in to get a token.
 */
async function createAdmin(overrides) {
  var data = Object.assign({
    name:     'Test Admin',
    email:    'admin@test.com',
    password: 'Admin@123',
    role:     'admin'
  }, overrides);

  // Hash the password manually since we're inserting directly
  var salt = bcrypt.genSaltSync(10);
  var hashed = bcrypt.hashSync(data.password, salt);

  // Save admin directly to DB (not via register route — that always sets role=customer)
  var adminDoc = await User.create({
    name:     data.name,
    email:    data.email,
    password: hashed,
    role:     'admin'
  });

  // Now login through the API to get a real token
  var res = await request(app)
    .post('/api/auth/login')
    .send({ email: data.email, password: data.password });

  return {
    token: res.body.token,
    user:  res.body.user,
    id:    res.body.user.id,
    doc:   adminDoc           // the raw Mongoose document
  };
}

// =============================================================================
// MENU ITEM HELPERS
// =============================================================================

/**
 * createMenuItem()
 * Creates a menu item in the database and returns it.
 * Pass overrides to customise the item (name, price, category etc.)
 */
async function createMenuItem(overrides) {
  var data = Object.assign({
    name:        'Test Pizza',
    description: 'A delicious test pizza',
    price:       199,
    category:    'pizza',
    isAvailable: true,
    size:        'medium'
  }, overrides);

  var item = await MenuItem.create(data);
  return item;
}

/**
 * createMenuItemViaAPI()
 * Creates a menu item through the actual POST /api/menu endpoint.
 * Requires an admin token.
 */
async function createMenuItemViaAPI(adminToken, overrides) {
  var data = Object.assign({
    name:     'Test Pizza',
    price:    199,
    category: 'pizza'
  }, overrides);

  var res = await request(app)
    .post('/api/menu')
    .set('Authorization', 'Bearer ' + adminToken)
    .send(data);

  return res.body.item || res.body;
}

// =============================================================================
// ORDER HELPERS
// =============================================================================

/**
 * placeOrder()
 * Places an order through the API.
 * Requires a customer token and at least one menu item ID.
 */
async function placeOrder(customerToken, menuItemId, overrides) {
  var data = Object.assign({
    items:           [{ menuItem: menuItemId, quantity: 1 }],
    deliveryMode:    'delivery',
    deliveryAddress: '456 Test Avenue',
    paymentMode:     'cash'
  }, overrides);

  var res = await request(app)
    .post('/api/orders')
    .set('Authorization', 'Bearer ' + customerToken)
    .send(data);

  return res;
}

module.exports = {
  createCustomer,
  createAdmin,
  createMenuItem,
  createMenuItemViaAPI,
  placeOrder
};
