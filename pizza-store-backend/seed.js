const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const MenuItem = require('./models/MenuItem');

var menuItems = [
  // Pizzas
  { name: 'Margherita', description: 'Classic tomato sauce, mozzarella, basil', price: 199, category: 'pizza', size: 'medium', isAvailable: true },
  { name: 'Pepperoni', description: 'Tomato sauce, mozzarella, pepperoni slices', price: 249, category: 'pizza', size: 'medium', isAvailable: true },
  { name: 'Veggie Supreme', description: 'Bell peppers, onions, mushrooms, olives', price: 229, category: 'pizza', size: 'medium', isAvailable: true },
  { name: 'BBQ Chicken', description: 'BBQ sauce, grilled chicken, red onion', price: 279, category: 'pizza', size: 'medium', isAvailable: true },
  { name: 'Paneer Tikka', description: 'Paneer, tikka sauce, capsicum', price: 259, category: 'bestsellers', size: 'medium', isAvailable: true },
  { name: 'Double Cheese Burst', description: 'Extra cheese stuffed crust with toppings', price: 299, category: 'new launches', size: 'large', isAvailable: true },

  // Sides
  { name: 'Garlic Bread', description: 'Toasted garlic bread with herbs', price: 99, category: 'sides', size: 'N/A', isAvailable: true },
  { name: 'Chicken Wings (6 pcs)', description: 'Crispy spicy chicken wings', price: 149, category: 'sides', size: 'N/A', isAvailable: true },
  { name: 'Caesar Salad', description: 'Fresh romaine, croutons, caesar dressing', price: 129, category: 'sides', size: 'N/A', isAvailable: true },

  // Beverages
  { name: 'Pepsi', description: '250ml chilled Pepsi', price: 49, category: 'beverages', size: 'regular', isAvailable: true },
  { name: 'Lemonade', description: 'Fresh squeezed lemonade', price: 69, category: 'beverages', size: 'regular', isAvailable: true },
  { name: 'Mango Smoothie', description: 'Fresh mango blended with milk', price: 89, category: 'beverages', size: 'regular', isAvailable: true },

  // Combos
  { name: 'Family Feast', description: '2 medium pizzas + garlic bread + 2 Pepsi', price: 599, category: 'combo', size: 'N/A', isAvailable: true },
  { name: 'Solo Deal', description: '1 personal pizza + 1 side + 1 beverage', price: 299, category: 'combo', size: 'N/A', isAvailable: true }
];

mongoose.connect(process.env.MONGO_URI).then(function() {
  console.log('Connected to MongoDB');

  // Create admin user
  var salt = bcrypt.genSaltSync(10);
  var hashedPassword = bcrypt.hashSync('admin123', salt);

  var adminUser = new User({
    name: 'Admin',
    email: 'admin@pizzastore.com',
    password: hashedPassword,
    role: 'admin',
    phone: '9999999999'
  });

  // Clear existing data and insert fresh
  User.deleteMany({ role: 'admin' }).then(function() {
    return adminUser.save();
  }).then(function() {
    console.log('Admin created — email: admin@pizzastore.com | password: admin123');
    return MenuItem.deleteMany({});
  }).then(function() {
    return MenuItem.insertMany(menuItems);
  }).then(function() {
    console.log(menuItems.length + ' menu items inserted');
    console.log('Seed complete!');
    process.exit(0);
  }).catch(function(err) {
    console.log('Seed error:', err.message);
    process.exit(1);
  });

}).catch(function(err) {
  console.log('DB connection error:', err.message);
  process.exit(1);
});
