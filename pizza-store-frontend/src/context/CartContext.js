import React, { createContext, useState, useContext } from 'react';

var CartContext = createContext();

export function CartProvider({ children }) {
  var [cartItems, setCartItems] = useState([]);

  function addToCart(item) {
    setCartItems(function(prev) {
      var existing = prev.find(function(i) { return i._id === item._id; });
      if (existing) {
        return prev.map(function(i) {
          return i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i;
        });
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function removeFromCart(id) {
    setCartItems(function(prev) { return prev.filter(function(i) { return i._id !== id; }); });
  }

  function updateQuantity(id, qty) {
    if (qty < 1) { removeFromCart(id); return; }
    setCartItems(function(prev) {
      return prev.map(function(i) { return i._id === id ? { ...i, quantity: qty } : i; });
    });
  }

  function clearCart() { setCartItems([]); }

  var totalItems = cartItems.reduce(function(sum, i) { return sum + i.quantity; }, 0);
  var totalAmount = cartItems.reduce(function(sum, i) { return sum + i.price * i.quantity; }, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() { return useContext(CartContext); }
