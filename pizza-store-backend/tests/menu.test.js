// tests/menu.test.js
// =============================================================================
// MENU ITEM TESTS
// =============================================================================
// Tests for:
//   GET    /api/menu          — Get all menu items (public, with filters)
//   GET    /api/menu/:id      — Get a single menu item
//   POST   /api/menu          — Admin: create a new menu item
//   PUT    /api/menu/:id      — Admin: update a menu item
//   DELETE /api/menu/:id      — Admin: delete a menu item
// =============================================================================

const request = require('supertest');
const app     = require('../app');
const { createCustomer, createAdmin, createMenuItem } = require('./helpers');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/menu — Get All Items (Public)
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/menu — Get All Menu Items', function () {

  beforeEach(async function () {
    // Insert 4 items directly into DB before each test
    await createMenuItem({ name: 'Margherita',    category: 'pizza',    price: 199 });
    await createMenuItem({ name: 'Pepperoni',     category: 'pizza',    price: 249 });
    await createMenuItem({ name: 'Garlic Bread',  category: 'sides',    price: 99  });
    await createMenuItem({ name: 'Pepsi',         category: 'beverages',price: 49  });
  });

  // ✅ Public access — no login needed
  test('should return all menu items without any login', async function () {
    var res = await request(app).get('/api/menu');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(4);
  });

  // ✅ Filter by category
  test('should return only pizza items when category=pizza is passed', async function () {
    var res = await request(app).get('/api/menu?category=pizza');

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
    // Every item in the response should be a pizza
    res.body.forEach(function (item) {
      expect(item.category).toBe('pizza');
    });
  });

  test('should return only sides when category=sides is passed', async function () {
    var res = await request(app).get('/api/menu?category=sides');

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Garlic Bread');
  });

  // ✅ Search by name (partial, case-insensitive)
  test('should return matching items when search query is given', async function () {
    var res = await request(app).get('/api/menu?search=pepperoni');

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Pepperoni');
  });

  test('search should be case-insensitive', async function () {
    var res = await request(app).get('/api/menu?search=GARLIC');

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Garlic Bread');
  });

  test('search with partial text should work (e.g. "marg" matches "Margherita")', async function () {
    var res = await request(app).get('/api/menu?search=marg');

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Margherita');
  });

  // ✅ No results is still a 200 with empty array (not an error)
  test('should return empty array if no items match the search', async function () {
    var res = await request(app).get('/api/menu?search=xyz99999');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  // ✅ Both filters can be combined
  test('should support combining category and search filters', async function () {
    var res = await request(app).get('/api/menu?category=pizza&search=pepp');

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Pepperoni');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/menu/:id — Get Single Item
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/menu/:id — Get Single Menu Item', function () {

  test('should return a single menu item by its ID', async function () {
    var item = await createMenuItem({ name: 'Veggie Supreme', price: 229 });

    var res = await request(app).get('/api/menu/' + item._id);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'Veggie Supreme');
    expect(res.body).toHaveProperty('price', 229);
  });

  test('should return 404 for a non-existent ID', async function () {
    // A valid MongoDB ObjectId format but doesn't exist in DB
    var fakeId = '64abcdef1234567890abcdef';

    var res = await request(app).get('/api/menu/' + fakeId);

    expect(res.statusCode).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/menu — Create Item (Admin Only)
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/menu — Admin: Create Menu Item', function () {

  test('admin should be able to create a new menu item', async function () {
    var { token } = await createAdmin();

    var res = await request(app)
      .post('/api/menu')
      .set('Authorization', 'Bearer ' + token)
      .send({
        name:        'New Paneer Pizza',
        description: 'Paneer tikka on crispy base',
        price:       279,
        category:    'pizza',
        size:        'large'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message');

    // Verify the item is now in the DB by fetching it
    var listRes = await request(app).get('/api/menu');
    var found = listRes.body.find(function (i) { return i.name === 'New Paneer Pizza'; });
    expect(found).toBeTruthy();
    expect(found.price).toBe(279);
  });

  // ❌ Customer cannot create items
  test('should return 403 when a customer tries to create a menu item', async function () {
    var { token } = await createCustomer();

    var res = await request(app)
      .post('/api/menu')
      .set('Authorization', 'Bearer ' + token)
      .send({ name: 'Sneaky Pizza', price: 1, category: 'pizza' });

    expect(res.statusCode).toBe(403);
  });

  // ❌ Unauthenticated
  test('should return 401 when no token is provided', async function () {
    var res = await request(app)
      .post('/api/menu')
      .send({ name: 'Ghost Pizza', price: 100, category: 'pizza' });

    expect(res.statusCode).toBe(401);
  });

  // ❌ Missing required fields
  test('should return 400 if name is missing', async function () {
    var { token } = await createAdmin();

    var res = await request(app)
      .post('/api/menu')
      .set('Authorization', 'Bearer ' + token)
      .send({ price: 199, category: 'pizza' });

    expect(res.statusCode).toBe(400);
  });

  test('should return 400 if price is missing', async function () {
    var { token } = await createAdmin();

    var res = await request(app)
      .post('/api/menu')
      .set('Authorization', 'Bearer ' + token)
      .send({ name: 'No Price Pizza', category: 'pizza' });

    expect(res.statusCode).toBe(400);
  });

  test('should return 400 if category is missing', async function () {
    var { token } = await createAdmin();

    var res = await request(app)
      .post('/api/menu')
      .set('Authorization', 'Bearer ' + token)
      .send({ name: 'No Category Pizza', price: 199 });

    expect(res.statusCode).toBe(400);
  });

  test('should return 400 if category is not one of the allowed values', async function () {
    var { token } = await createAdmin();

    var res = await request(app)
      .post('/api/menu')
      .set('Authorization', 'Bearer ' + token)
      .send({ name: 'Bad Category', price: 100, category: 'sushi' }); // invalid category

    expect(res.statusCode).toBe(400);
  });

  test('new item should default to isAvailable=true if not provided', async function () {
    var { token } = await createAdmin();

    var res = await request(app)
      .post('/api/menu')
      .set('Authorization', 'Bearer ' + token)
      .send({ name: 'Default Available', price: 100, category: 'sides' });

    expect(res.statusCode).toBe(201);

    // Fetch and check isAvailable
    var listRes = await request(app).get('/api/menu');
    var item = listRes.body.find(function (i) { return i.name === 'Default Available'; });
    expect(item.isAvailable).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/menu/:id — Update Item (Admin Only)
// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/menu/:id — Admin: Update Menu Item', function () {

  test('admin should be able to update name and price', async function () {
    var item = await createMenuItem({ name: 'Old Name', price: 100 });
    var { token } = await createAdmin();

    var res = await request(app)
      .put('/api/menu/' + item._id)
      .set('Authorization', 'Bearer ' + token)
      .send({ name: 'New Name', price: 150 });

    expect(res.statusCode).toBe(200);
    expect(res.body.item.name).toBe('New Name');
    expect(res.body.item.price).toBe(150);
  });

  test('should support partial update — only send fields you want to change', async function () {
    var item = await createMenuItem({ name: 'Keep Name', price: 200 });
    var { token } = await createAdmin();

    // Only update price, not name
    var res = await request(app)
      .put('/api/menu/' + item._id)
      .set('Authorization', 'Bearer ' + token)
      .send({ price: 250 });

    expect(res.statusCode).toBe(200);
    expect(res.body.item.price).toBe(250);
    expect(res.body.item.name).toBe('Keep Name'); // should be unchanged
  });

  test('admin should be able to mark an item as unavailable', async function () {
    var item = await createMenuItem({ isAvailable: true });
    var { token } = await createAdmin();

    var res = await request(app)
      .put('/api/menu/' + item._id)
      .set('Authorization', 'Bearer ' + token)
      .send({ isAvailable: false });

    expect(res.statusCode).toBe(200);
    expect(res.body.item.isAvailable).toBe(false);
  });

  test('should return 403 if a customer tries to update an item', async function () {
    var item = await createMenuItem();
    var { token } = await createCustomer();

    var res = await request(app)
      .put('/api/menu/' + item._id)
      .set('Authorization', 'Bearer ' + token)
      .send({ price: 1 });

    expect(res.statusCode).toBe(403);
  });

  test('should return 404 for updating a non-existent item', async function () {
    var { token } = await createAdmin();

    var res = await request(app)
      .put('/api/menu/64abcdef1234567890abcdef')
      .set('Authorization', 'Bearer ' + token)
      .send({ price: 999 });

    expect(res.statusCode).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/menu/:id — Delete Item (Admin Only)
// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/menu/:id — Admin: Delete Menu Item', function () {

  test('admin should be able to delete a menu item', async function () {
    var item = await createMenuItem({ name: 'To Be Deleted' });
    var { token } = await createAdmin();

    var res = await request(app)
      .delete('/api/menu/' + item._id)
      .set('Authorization', 'Bearer ' + token);

    expect(res.statusCode).toBe(200);

    // Confirm it's gone from the DB
    var getRes = await request(app).get('/api/menu/' + item._id);
    expect(getRes.statusCode).toBe(404);
  });

  test('should return 403 if a customer tries to delete an item', async function () {
    var item = await createMenuItem();
    var { token } = await createCustomer();

    var res = await request(app)
      .delete('/api/menu/' + item._id)
      .set('Authorization', 'Bearer ' + token);

    expect(res.statusCode).toBe(403);
  });

  test('should return 404 when deleting a non-existent item', async function () {
    var { token } = await createAdmin();

    var res = await request(app)
      .delete('/api/menu/64abcdef1234567890abcdef')
      .set('Authorization', 'Bearer ' + token);

    expect(res.statusCode).toBe(404);
  });

  test('should return 401 when no token is provided', async function () {
    var item = await createMenuItem();

    var res = await request(app).delete('/api/menu/' + item._id);

    expect(res.statusCode).toBe(401);
  });
});
