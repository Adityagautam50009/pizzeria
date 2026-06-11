const MenuItem = require('../models/MenuItem');

// GET /api/menu  — all items, supports ?category=pizza&search=margherita
function getAllItems(req, res) {
  var filter = {};

  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.available === 'true') {
    filter.isAvailable = true;
  }

  if (req.query.search) {
    filter.name = { $regex: req.query.search, $options: 'i' };
  }

  MenuItem.find(filter).then(function(items) {
    res.json(items);
  }).catch(function(err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  });
}

// GET /api/menu/:id
function getItemById(req, res) {
  MenuItem.findById(req.params.id).then(function(item) {
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(item);
  }).catch(function(err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  });
}

// POST /api/menu  (admin only)
function createItem(req, res) {
  var name = req.body.name;
  var price = req.body.price;
  var category = req.body.category;

  if (!name || !price || !category) {
    return res.status(400).json({ message: 'Name, price and category are required' });
  }

  var newItem = new MenuItem({
    name: name,
    description: req.body.description || '',
    price: price,
    category: category,
    image: req.body.image || '',
    isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable : true,
    size: req.body.size || 'N/A'
  });

  newItem.save().then(function(item) {
    res.status(201).json({ message: 'Menu item created', item: item });
  }).catch(function(err) {
    res.status(500).json({ message: 'Error creating item', error: err.message });
  });
}

// PUT /api/menu/:id  (admin only)
function updateItem(req, res) {
  MenuItem.findById(req.params.id).then(function(item) {
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    item.name = req.body.name || item.name;
    item.description = req.body.description || item.description;
    item.price = req.body.price || item.price;
    item.category = req.body.category || item.category;
    item.image = req.body.image || item.image;
    item.size = req.body.size || item.size;

    if (req.body.isAvailable !== undefined) {
      item.isAvailable = req.body.isAvailable;
    }

    item.save().then(function(updated) {
      res.json({ message: 'Menu item updated', item: updated });
    });
  }).catch(function(err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  });
}

// DELETE /api/menu/:id  (admin only)
function deleteItem(req, res) {
  MenuItem.findByIdAndDelete(req.params.id).then(function(item) {
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted' });
  }).catch(function(err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  });
}

module.exports = { getAllItems, getItemById, createItem, updateItem, deleteItem };
