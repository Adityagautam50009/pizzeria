// tests/auth.test.js
// =============================================================================
// AUTHENTICATION TESTS
// =============================================================================
// Tests for:
//   POST   /api/auth/register   — Create a new customer account
//   POST   /api/auth/login      — Login and get a JWT token
//   GET    /api/auth/profile    — Get the logged-in user's profile
//   PUT    /api/auth/profile    — Update the logged-in user's profile
//   GET    /api/auth/users      — Admin: get all customer accounts
//
// KEY CONCEPTS:
//   - Each test is independent — the database is cleared between tests
//   - We use supertest to make real HTTP requests to the app
//   - We check HTTP status codes AND response body content
// =============================================================================

const request = require('supertest');
const app     = require('../app');
const { createCustomer, createAdmin } = require('./helpers');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/register — User Registration', function () {

  // ✅ Happy path: valid data should succeed
  test('should register a new customer and return a token', async function () {
    var res = await request(app)
      .post('/api/auth/register')
      .send({
        name:     'Aditya Kumar',
        email:    'aditya@test.com',
        password: 'Test@123'
      });

    // HTTP 201 = Created
    expect(res.statusCode).toBe(201);

    // Response must contain a JWT token string
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');

    // Response must contain user info
    expect(res.body.user).toHaveProperty('name', 'Aditya Kumar');
    expect(res.body.user).toHaveProperty('email', 'aditya@test.com');

    // Role must default to 'customer' — never 'admin' on register
    expect(res.body.user).toHaveProperty('role', 'customer');
  });

  // ✅ Password should NOT be returned in the response
  test('should never return the password in the response', async function () {
    var res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'safe@test.com', password: 'Test@123' });

    expect(res.body.user).not.toHaveProperty('password');
  });

  // ❌ Missing required fields
  test('should return 400 if name is missing', async function () {
    var res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'no@name.com', password: 'Test@123' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  test('should return 400 if email is missing', async function () {
    var res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', password: 'Test@123' });

    expect(res.statusCode).toBe(400);
  });

  test('should return 400 if password is missing', async function () {
    var res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test@test.com' });

    expect(res.statusCode).toBe(400);
  });

  // ❌ Duplicate email
  test('should return 400 if email is already registered', async function () {
    // Register first time — should succeed
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'First User', email: 'duplicate@test.com', password: 'Test@123' });

    // Register same email again — should fail
    var res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Second User', email: 'duplicate@test.com', password: 'Test@123' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already registered/i);
  });

  // ✅ Optional fields should be accepted
  test('should accept optional phone and address fields', async function () {
    var res = await request(app)
      .post('/api/auth/register')
      .send({
        name:     'Full User',
        email:    'full@test.com',
        password: 'Test@123',
        phone:    '9876543210',
        address:  '123 Main St, Delhi'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login — User Login', function () {

  // Register a customer before each login test
  beforeEach(async function () {
    await request(app).post('/api/auth/register').send({
      name: 'Login Test User', email: 'logintest@test.com', password: 'Test@123'
    });
  });

  // ✅ Correct credentials
  test('should login with correct credentials and return a token', async function () {
    var res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'logintest@test.com', password: 'Test@123' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('logintest@test.com');
  });

  // ❌ Wrong password
  test('should return 400 for wrong password', async function () {
    var res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'logintest@test.com', password: 'WrongPassword' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/invalid/i);
  });

  // ❌ Non-existent email
  test('should return 400 for an email that does not exist', async function () {
    var res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'Test@123' });

    expect(res.statusCode).toBe(400);
  });

  // ❌ Missing fields
  test('should return 400 if email is missing', async function () {
    var res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'Test@123' });

    expect(res.statusCode).toBe(400);
  });

  test('should return 400 if password is missing', async function () {
    var res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'logintest@test.com' });

    expect(res.statusCode).toBe(400);
  });

  // ✅ Login is case-insensitive for email
  test('should login regardless of email letter case', async function () {
    var res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'LOGINTEST@TEST.COM', password: 'Test@123' });

    // Should succeed — schema stores emails as lowercase
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/profile
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/auth/profile — Get Profile', function () {

  test('should return the logged-in user profile', async function () {
    // 1. Create a customer and get their token
    var { token } = await createCustomer();

    // 2. Use the token to get their profile
    var res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer ' + token);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', 'customer@test.com');
    expect(res.body).toHaveProperty('name', 'Test Customer');
    expect(res.body).not.toHaveProperty('password'); // password should never be returned
  });

  test('should return 401 if no token is provided', async function () {
    var res = await request(app).get('/api/auth/profile');
    // 401 = Unauthorized
    expect(res.statusCode).toBe(401);
  });

  test('should return 401 if token is invalid/fake', async function () {
    var res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer this.is.a.fake.token');

    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/profile — Update Profile
// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/auth/profile — Update Profile', function () {

  test('should update the user name and phone', async function () {
    var { token } = await createCustomer();

    var res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', 'Bearer ' + token)
      .send({ name: 'Updated Name', phone: '9000011111' });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.name).toBe('Updated Name');
    expect(res.body.user.phone).toBe('9000011111');
  });

  test('should allow changing the password', async function () {
    var { token, user } = await createCustomer();

    // Change password
    var updateRes = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', 'Bearer ' + token)
      .send({ password: 'NewPass@456' });

    expect(updateRes.statusCode).toBe(200);

    // Login with the new password — should succeed
    var loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'NewPass@456' });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.token).toBeTruthy();
  });

  test('should return 401 if not logged in', async function () {
    var res = await request(app)
      .put('/api/auth/profile')
      .send({ name: 'Hacker' });

    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/users — Admin: Get All Customers
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/auth/users — Admin: Get All Users', function () {

  test('admin should get a list of all customers', async function () {
    // Create some customers
    await createCustomer({ email: 'c1@test.com' });
    await createCustomer({ email: 'c2@test.com' });

    // Create admin
    var { token } = await createAdmin();

    var res = await request(app)
      .get('/api/auth/users')
      .set('Authorization', 'Bearer ' + token);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);

    // Passwords should not be in the list
    expect(res.body[0]).not.toHaveProperty('password');
  });

  test('should return 403 if a customer tries to access /users', async function () {
    // Create a customer and use THEIR token
    var { token } = await createCustomer();

    var res = await request(app)
      .get('/api/auth/users')
      .set('Authorization', 'Bearer ' + token);

    // 403 = Forbidden (logged in, but not admin)
    expect(res.statusCode).toBe(403);
  });

  test('should return 401 if no token is provided', async function () {
    var res = await request(app).get('/api/auth/users');
    expect(res.statusCode).toBe(401);
  });

  test('admin list should not include admin accounts — only customers', async function () {
    await createCustomer({ email: 'cust@test.com' });
    var { token } = await createAdmin();

    var res = await request(app)
      .get('/api/auth/users')
      .set('Authorization', 'Bearer ' + token);

    // All returned users should have role 'customer'
    res.body.forEach(function (u) {
      expect(u.role).toBe('customer');
    });
  });
});
