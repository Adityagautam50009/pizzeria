// tests/setup.js
// =============================================================================
// TEST SETUP FILE
// =============================================================================
// This file runs automatically before every test file.
//
// It connects to a SEPARATE test database (pizzastore_test) so your real
// data is never touched. After each test it wipes the test database clean,
// and after all tests it disconnects.
//
// ⚠️  Make sure MongoDB is running on your machine before running tests!
//     Run:  mongod
//     Then: npm test
// =============================================================================

const mongoose = require('mongoose');

// Use a special test database — completely separate from your real "pizzastore" DB
var TEST_DB_URI = 'mongodb://localhost:27017/pizzastore_test';

// beforeAll: runs ONCE before all tests — open the DB connection
beforeAll(async function () {
  await mongoose.connect(TEST_DB_URI);
  console.log('\n🧪 Connected to test database: pizzastore_test');
});

// afterEach: runs after EACH test — wipe all collections clean
// This ensures every test starts with a fresh, empty database
afterEach(async function () {
  var collections = mongoose.connection.collections;
  for (var key in collections) {
    await collections[key].deleteMany({});
  }
});

// afterAll: runs ONCE after all tests — close the DB connection
afterAll(async function () {
  await mongoose.connection.dropDatabase(); // delete the test DB entirely
  await mongoose.disconnect();
  console.log('✅ Test database cleaned up and disconnected');
});
