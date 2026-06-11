import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Chip, Button, CircularProgress,
  Alert, Divider, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { getOrders, cancelOrder, getOrderBill } from '../api/api';
import { useLocation } from 'react-router-dom';

var STATUS_COLORS = {
  pending: 'warning', accepted: 'info', rejected: 'error',
  cancelled: 'default', delivered: 'success'
};

var STATUS_EMOJIS = { pending: '⏳', accepted: '✅', rejected: '❌', cancelled: '🚫', delivered: '🚚' };

export default function MyOrders() {
  var [orders, setOrders] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState('');
  var [bill, setBill] = useState(null);
  var [billOpen, setBillOpen] = useState(false);
  var location = useLocation();
  var successMessage = location.state?.successMessage;

  function fetchOrders() {
    setLoading(true);
    getOrders().then(function(res) {
      setOrders(res.data);
    }).catch(function() {
      setError('Failed to load orders');
    }).finally(function() { setLoading(false); });
  }

  useEffect(function() { fetchOrders(); }, []);

  function handleCancel(id) {
    cancelOrder(id).then(function() { fetchOrders(); }).catch(function(err) {
      setError(err.response?.data?.message || 'Failed to cancel');
    });
  }

  function handleViewBill(id) {
    getOrderBill(id).then(function(res) {
      setBill(res.data); setBillOpen(true);
    }).catch(function() { setError('Failed to load bill'); });
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Typography variant="h4" fontWeight={700} color="#00897b" gutterBottom>My Orders</Typography>

      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={function() { setError(''); }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress sx={{ color: '#00897b' }} /></Box>
      ) : orders.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 10 }}>
          <ReceiptIcon sx={{ fontSize: 72, color: '#e0e0e0' }} />
          <Typography color="text.secondary" mt={1} variant="h6">No orders yet</Typography>
          <Typography color="text.secondary" variant="body2">Place your first order from the menu!</Typography>
        </Box>
      ) : (
        orders.map(function(order) {
          return (
            <Paper key={order._id} sx={{ mb: 2, borderRadius: 3, overflow: 'hidden', boxShadow: 2 }}>
              {/* Order Header */}
              <Box sx={{ p: 2, bgcolor: '#fff3e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Order ID</Typography>
                  <Typography fontWeight={700}>#{order._id.slice(-8).toUpperCase()}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Typography>
                <Chip
                  label={STATUS_EMOJIS[order.status] + ' ' + order.status.toUpperCase()}
                  color={STATUS_COLORS[order.status]} size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Box>

              {/* Order Body */}
              <Box sx={{ p: 2 }}>
                {/* Status message popup style */}
                {order.statusMessage && (
                  <Alert
                    severity={order.status === 'rejected' || order.status === 'cancelled' ? 'error' : order.status === 'delivered' ? 'success' : 'info'}
                    sx={{ mb: 2, py: 0.5, borderRadius: 2 }}
                  >
                    {order.statusMessage}
                  </Alert>
                )}

                {/* Items */}
                {order.items.map(function(item, idx) {
                  return (
                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">🍕 {item.name} × {item.quantity}</Typography>
                      <Typography variant="body2" fontWeight={500}>₹{item.price * item.quantity}</Typography>
                    </Box>
                  );
                })}

                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography fontWeight={700}>Total</Typography>
                  <Typography fontWeight={700} color="#00897b" variant="h6">₹{order.totalAmount}</Typography>
                </Box>

                {/* Tags */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip label={order.deliveryMode === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'} size="small" variant="outlined" />
                  <Chip label={'💳 ' + order.paymentMode.toUpperCase()} size="small" variant="outlined" />
                  {order.deliveryAddress && (
                    <Chip label={'📍 ' + order.deliveryAddress} size="small" variant="outlined" sx={{ maxWidth: 200 }} />
                  )}
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {order.status === 'pending' && (
                    <Button size="small" color="error" variant="outlined" onClick={function() { handleCancel(order._id); }}
                      sx={{ borderRadius: 2 }}>
                      Cancel Order
                    </Button>
                  )}
                  <Button size="small" variant="outlined" onClick={function() { handleViewBill(order._id); }}
                    sx={{ borderRadius: 2, borderColor: '#00897b', color: '#00897b' }}>
                    🧾 View Bill
                  </Button>
                </Box>
              </Box>
            </Paper>
          );
        })
      )}

      {/* Bill Dialog */}
      <Dialog open={billOpen} onClose={function() { setBillOpen(false); }} maxWidth="sm" fullWidth>
        {bill && (
          <>
            <DialogTitle sx={{ bgcolor: '#00897b', color: 'white', fontWeight: 700 }}>
              🧾 Bill — {bill.billNumber}
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {new Date(bill.orderedAt).toLocaleString('en-IN')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {bill.items.map(function(item, idx) {
                return (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{item.name} × {item.quantity}</Typography>
                    <Typography variant="body2">₹{item.subtotal}</Typography>
                  </Box>
                );
              })}
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="body2">₹{bill.subtotal}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">GST (5%)</Typography>
                <Typography variant="body2">₹{bill.tax}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography fontWeight={700} variant="h6">Grand Total</Typography>
                <Typography fontWeight={700} variant="h6" color="#00897b">₹{bill.grandTotal}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={'💳 ' + bill.paymentMode.toUpperCase()} size="small" />
                <Chip label={bill.deliveryMode === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'} size="small" />
                <Chip label={bill.orderStatus.toUpperCase()} color={STATUS_COLORS[bill.orderStatus]} size="small" />
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={function() { setBillOpen(false); }} variant="contained"
                sx={{ bgcolor: '#00897b', '&:hover': { bgcolor: '#004d40' } }}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
