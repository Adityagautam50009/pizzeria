import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, Button, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Divider, Tabs, Tab
} from '@mui/material';
import { getOrders, updateOrderStatus, getOrderBill } from '../../api/api';

var STATUS_COLORS = {
  pending: 'warning', accepted: 'info', rejected: 'error',
  cancelled: 'default', delivered: 'success'
};
var STATUS_EMOJIS = { pending: '⏳', accepted: '✅', rejected: '❌', cancelled: '🚫', delivered: '🚚' };
var TABS = ['all', 'pending', 'accepted', 'delivered', 'rejected', 'cancelled'];

export default function AdminOrders() {
  var [orders, setOrders] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState('');
  var [activeTab, setActiveTab] = useState(0);
  var [statusDialog, setStatusDialog] = useState(null);
  var [statusForm, setStatusForm] = useState({ status: 'accepted', statusMessage: '' });
  var [saving, setSaving] = useState(false);
  var [bill, setBill] = useState(null);
  var [billOpen, setBillOpen] = useState(false);

  var fetchOrders = useCallback(function() {
    setLoading(true);
    var params = TABS[activeTab] !== 'all' ? { status: TABS[activeTab] } : {};
    getOrders(params).then(function(res) { setOrders(res.data); })
      .catch(function() { setError('Failed to load orders'); })
      .finally(function() { setLoading(false); });
  }, [activeTab]);

  useEffect(function() { fetchOrders(); }, [fetchOrders]);

  function openStatusDialog(order) {
    setStatusDialog(order);
    setStatusForm({ status: 'accepted', statusMessage: '' });
  }

  function handleStatusUpdate() {
    setSaving(true);
    updateOrderStatus(statusDialog._id, statusForm).then(function() {
      setStatusDialog(null); fetchOrders();
    }).catch(function(err) {
      setError(err.response?.data?.message || 'Update failed');
    }).finally(function() { setSaving(false); });
  }

  function handleViewBill(id) {
    getOrderBill(id).then(function(res) { setBill(res.data); setBillOpen(true); })
      .catch(function() { setError('Failed to load bill'); });
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Typography variant="h4" fontWeight={700} color="#00897b" gutterBottom>Manage Orders</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={function() { setError(''); }}>{error}</Alert>}

      {/* Status Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={function(e, v) { setActiveTab(v); }}
          variant="scrollable" scrollButtons="auto"
          TabIndicatorProps={{ style: { backgroundColor: '#00897b' } }}>
          {TABS.map(function(t) {
            return (
              <Tab key={t}
                label={(STATUS_EMOJIS[t] ? STATUS_EMOJIS[t] + ' ' : '📋 ') + t.charAt(0).toUpperCase() + t.slice(1)}
                sx={{ textTransform: 'capitalize', fontWeight: 600, '&.Mui-selected': { color: '#00897b' } }}
              />
            );
          })}
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress sx={{ color: '#00897b' }} /></Box>
      ) : orders.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary">No orders found</Typography>
        </Box>
      ) : (
        orders.map(function(order) {
          return (
            <Paper key={order._id} sx={{ mb: 2, borderRadius: 3, overflow: 'hidden', boxShadow: 2 }}>
              {/* Order Header */}
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography fontWeight={700}>#{order._id.slice(-8).toUpperCase()}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    👤 {order.customer?.name} · {order.customer?.email}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                  <Chip
                    label={STATUS_EMOJIS[order.status] + ' ' + order.status.toUpperCase()}
                    color={STATUS_COLORS[order.status]} size="small" sx={{ fontWeight: 700 }}
                  />
                </Box>
              </Box>

              {/* Order Body */}
              <Box sx={{ p: 2 }}>
                {order.items.map(function(item, idx) {
                  return (
                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">🍕 {item.name} × {item.quantity}</Typography>
                      <Typography variant="body2" fontWeight={500}>₹{item.price * item.quantity}</Typography>
                    </Box>
                  );
                })}
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography fontWeight={700}>Total</Typography>
                  <Typography fontWeight={700} color="#00897b" variant="h6">₹{order.totalAmount}</Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip label={order.deliveryMode === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'} size="small" variant="outlined" />
                  <Chip label={'💳 ' + order.paymentMode.toUpperCase()} size="small" variant="outlined" />
                  {order.deliveryAddress && (
                    <Chip label={'📍 ' + order.deliveryAddress} size="small" variant="outlined" sx={{ maxWidth: 220 }} />
                  )}
                </Box>

                {order.statusMessage && (
                  <Alert severity="info" sx={{ mb: 2, py: 0.5, borderRadius: 2 }}>{order.statusMessage}</Alert>
                )}

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {(order.status === 'pending' || order.status === 'accepted') && (
                    <Button size="small" variant="contained"
                      sx={{ bgcolor: '#00897b', '&:hover': { bgcolor: '#004d40' }, borderRadius: 2 }}
                      onClick={function() { openStatusDialog(order); }}>
                      Update Status
                    </Button>
                  )}
                  <Button size="small" variant="outlined"
                    sx={{ borderRadius: 2, borderColor: '#00897b', color: '#00897b' }}
                    onClick={function() { handleViewBill(order._id); }}>
                    🧾 View Bill
                  </Button>
                </Box>
              </Box>
            </Paper>
          );
        })
      )}

      {/* Update Status Dialog */}
      <Dialog open={Boolean(statusDialog)} onClose={function() { setStatusDialog(null); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#00897b', color: 'white', fontWeight: 700 }}>Update Order Status</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {statusDialog && (
            <Typography variant="body2" color="text.secondary">
              Order #{statusDialog._id.slice(-8).toUpperCase()} by {statusDialog.customer?.name}
            </Typography>
          )}
          <FormControl size="small" fullWidth>
            <InputLabel>New Status</InputLabel>
            <Select value={statusForm.status} label="New Status"
              onChange={function(e) { setStatusForm(function(p) { return { ...p, status: e.target.value }; }); }}>
              <MenuItem value="accepted">✅ Accept Order</MenuItem>
              <MenuItem value="rejected">❌ Reject Order</MenuItem>
              <MenuItem value="delivered">🚚 Mark as Delivered</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Message to Customer (optional)" multiline rows={3} size="small" fullWidth
            value={statusForm.statusMessage}
            onChange={function(e) { setStatusForm(function(p) { return { ...p, statusMessage: e.target.value }; }); }}
            placeholder="Leave blank to use default message"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={function() { setStatusDialog(null); }}>Cancel</Button>
          <Button variant="contained" onClick={handleStatusUpdate} disabled={saving}
            sx={{ bgcolor: '#00897b', '&:hover': { bgcolor: '#004d40' } }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bill Dialog */}
      <Dialog open={billOpen} onClose={function() { setBillOpen(false); }} maxWidth="sm" fullWidth>
        {bill && (
          <>
            <DialogTitle sx={{ bgcolor: '#00897b', color: 'white', fontWeight: 700 }}>
              🧾 {bill.billNumber}
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Typography fontWeight={700}>{bill.customer?.name}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>{bill.customer?.email}</Typography>
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
                <Typography fontWeight={700}>Grand Total</Typography>
                <Typography fontWeight={700} color="#00897b">₹{bill.grandTotal}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={'💳 ' + bill.paymentMode} size="small" />
                <Chip label={bill.deliveryMode === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'} size="small" />
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
