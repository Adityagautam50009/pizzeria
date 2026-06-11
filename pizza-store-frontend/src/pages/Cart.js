import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, IconButton, Divider,
  TextField, MenuItem, Select, FormControl, InputLabel,
  Alert, CircularProgress, Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useCart } from '../context/CartContext';
import { placeOrder } from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  var { cartItems, removeFromCart, updateQuantity, clearCart, totalAmount } = useCart();
  var navigate = useNavigate();
  var [deliveryMode, setDeliveryMode] = useState('delivery');
  var [deliveryAddress, setDeliveryAddress] = useState('');
  var [paymentMode, setPaymentMode] = useState('cash');
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState('');

  var tax = parseFloat((totalAmount * 0.05).toFixed(2));
  var grandTotal = parseFloat((totalAmount + tax).toFixed(2));

  function handlePlaceOrder() {
    if (cartItems.length === 0) return;
    if (deliveryMode === 'delivery' && !deliveryAddress.trim()) {
      setError('Please enter a delivery address'); return;
    }
    setLoading(true); setError('');
    var items = cartItems.map(function(item) {
      return { menuItem: item._id, quantity: item.quantity };
    });
    placeOrder({ items, deliveryMode, deliveryAddress, paymentMode })
      .then(function(res) {
        clearCart();
        navigate('/orders', { state: { successMessage: 'Order placed! ID: #' + res.data.order._id.slice(-8).toUpperCase() } });
      }).catch(function(err) {
        setError(err.response?.data?.message || 'Failed to place order');
      }).finally(function() { setLoading(false); });
  }

  if (cartItems.length === 0) {
    return (
      <Box sx={{ maxWidth: 500, mx: 'auto', px: 2, py: 10, textAlign: 'center' }}>
        <ShoppingCartIcon sx={{ fontSize: 90, color: '#e0e0e0' }} />
        <Typography variant="h6" color="text.secondary" mt={2} gutterBottom>Your cart is empty</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Add some delicious items from our menu!</Typography>
        <Button variant="contained" sx={{ bgcolor: '#00897b', '&:hover': { bgcolor: '#004d40' }, borderRadius: 2, px: 4 }} onClick={function() { navigate('/menu'); }}>
          Browse Menu
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Typography variant="h4" fontWeight={700} color="#00897b" gutterBottom>Your Cart</Typography>
      <Grid container spacing={3}>

        {/* Items List */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: { xs: 0, md: 0 } }}>
            {cartItems.map(function(item, idx) {
              return (
                <Box key={item._id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', p: { xs: 1.5, sm: 2 }, gap: { xs: 1, sm: 2 } }}>
                    <Typography sx={{ fontSize: { xs: 28, sm: 36 } }}>🍕</Typography>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography fontWeight={600} noWrap>{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary">₹{item.price} each</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                      <IconButton size="small" onClick={function() { updateQuantity(item._id, item.quantity - 1); }}
                        sx={{ border: '1px solid #eee' }}>
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</Typography>
                      <IconButton size="small" onClick={function() { updateQuantity(item._id, item.quantity + 1); }}
                        sx={{ border: '1px solid #eee' }}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography fontWeight={700} sx={{ minWidth: 56, textAlign: 'right', color: '#00897b' }}>
                      ₹{item.price * item.quantity}
                    </Typography>
                    <IconButton size="small" color="error" onClick={function() { removeFromCart(item._id); }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  {idx < cartItems.length - 1 && <Divider />}
                </Box>
              );
            })}
            <Box sx={{ p: 2, bgcolor: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">{cartItems.length} item(s)</Typography>
              <Button size="small" color="error" onClick={function() { clearCart(); }}>Clear Cart</Button>
            </Box>
          </Paper>
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Order Summary</Typography>

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Delivery Mode</InputLabel>
              <Select value={deliveryMode} label="Delivery Mode" onChange={function(e) { setDeliveryMode(e.target.value); }}>
                <MenuItem value="delivery">🚚 Home Delivery</MenuItem>
                <MenuItem value="pickup">🏪 Store Pickup</MenuItem>
              </Select>
            </FormControl>

            {deliveryMode === 'delivery' && (
              <TextField
                fullWidth size="small" label="Delivery Address" multiline rows={2}
                value={deliveryAddress}
                onChange={function(e) { setDeliveryAddress(e.target.value); }}
                sx={{ mb: 2 }}
              />
            )}

            <FormControl fullWidth size="small" sx={{ mb: 3 }}>
              <InputLabel>Payment Mode</InputLabel>
              <Select value={paymentMode} label="Payment Mode" onChange={function(e) { setPaymentMode(e.target.value); }}>
                <MenuItem value="cash">💵 Cash on Delivery</MenuItem>
                <MenuItem value="card">💳 Card</MenuItem>
                <MenuItem value="upi">📱 UPI</MenuItem>
              </Select>
            </FormControl>

            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">Subtotal</Typography>
              <Typography>₹{totalAmount.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">GST (5%)</Typography>
              <Typography>₹{tax}</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography fontWeight={700} variant="h6">Grand Total</Typography>
              <Typography fontWeight={700} variant="h6" color="#00897b">₹{grandTotal}</Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Button fullWidth variant="contained" size="large" onClick={handlePlaceOrder} disabled={loading}
              sx={{ bgcolor: '#00897b', '&:hover': { bgcolor: '#004d40' }, borderRadius: 2, py: 1.5, fontWeight: 700 }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : '🍕 Place Order'}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
