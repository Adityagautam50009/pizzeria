import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, CircularProgress, Alert, Chip, Button, Divider
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { getRevenueSummary, getOrders } from '../../api/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

var STATUS_COLORS = {
  pending: 'warning', accepted: 'info', rejected: 'error',
  cancelled: 'default', delivered: 'success'
};
var STATUS_EMOJIS = { pending: '⏳', accepted: '✅', rejected: '❌', cancelled: '🚫', delivered: '🚚' };

export default function AdminDashboard() {
  var { user } = useAuth();
  var [summary, setSummary] = useState(null);
  var [recentOrders, setRecentOrders] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState('');
  var navigate = useNavigate();

  useEffect(function() {
    Promise.all([getRevenueSummary(), getOrders()])
      .then(function(results) {
        setSummary(results[0].data);
        setRecentOrders(results[1].data.slice(0, 6));
      }).catch(function() { setError('Failed to load dashboard'); })
      .finally(function() { setLoading(false); });
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
      <CircularProgress sx={{ color: '#00897b' }} />
    </Box>
  );

  var cards = [
    {
      label: 'Total Revenue', value: '₹' + (summary?.totalRevenue || 0),
      icon: <AttachMoneyIcon sx={{ fontSize: 38, color: '#00897b' }} />,
      bg: '#fff3e0', sub: 'From delivered orders'
    },
    {
      label: 'Total Orders', value: summary?.totalOrders || 0,
      icon: <ShoppingBagIcon sx={{ fontSize: 38, color: '#1565c0' }} />,
      bg: '#e3f2fd', sub: 'All time'
    },
    {
      label: 'Pending Orders', value: summary?.pendingOrders || 0,
      icon: <HourglassEmptyIcon sx={{ fontSize: 38, color: '#e65100' }} />,
      bg: '#fff8e1', sub: 'Awaiting action'
    }
  ];

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
      {/* Welcome */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} color="#00897b">Dashboard</Typography>
        <Typography color="text.secondary">Welcome back, {user?.name}! 👋</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cards.map(function(card) {
          return (
            <Grid item xs={12} sm={4} key={card.label}>
              <Paper sx={{ p: 3, borderRadius: 3, bgcolor: card.bg, boxShadow: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  {card.icon}
                  <Box>
                    <Typography variant="h4" fontWeight={800} lineHeight={1}>{card.value}</Typography>
                    <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">{card.sub}</Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Quick Links */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: '🍕 Manage Menu', path: '/admin/menu', color: '#00897b' },
          { label: '📦 Manage Orders', path: '/admin/orders', color: '#1565c0' },
          { label: '📊 Revenue Report', path: '/admin/revenue', color: '#2e7d32' }
        ].map(function(link) {
          return (
            <Grid item xs={12} sm={4} key={link.path}>
              <Button fullWidth variant="outlined"
                sx={{ py: 1.5, borderRadius: 2, borderColor: link.color, color: link.color, fontWeight: 700,
                  '&:hover': { bgcolor: link.color, color: 'white' }, transition: 'all 0.2s' }}
                onClick={function() { navigate(link.path); }}>
                {link.label}
              </Button>
            </Grid>
          );
        })}
      </Grid>

      {/* Recent Orders */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 2 }}>
        <Box sx={{ p: 2, bgcolor: '#00897b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" color="white" fontWeight={700}>Recent Orders</Typography>
          <Button size="small" sx={{ color: 'white', textDecoration: 'underline' }}
            onClick={function() { navigate('/admin/orders'); }}>
            View All →
          </Button>
        </Box>
        {recentOrders.length === 0 ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <Typography color="text.secondary">No orders yet</Typography>
          </Box>
        ) : (
          recentOrders.map(function(order, idx) {
            return (
              <Box key={order._id}>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography fontWeight={700} sx={{ fontSize: 14 }}>#{order._id.slice(-8).toUpperCase()}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {order.customer?.name} · {order.items?.length} item(s)
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography fontWeight={700} color="#00897b">₹{order.totalAmount}</Typography>
                    <Chip
                      label={STATUS_EMOJIS[order.status] + ' ' + order.status}
                      color={STATUS_COLORS[order.status]} size="small"
                    />
                  </Box>
                </Box>
                {idx < recentOrders.length - 1 && <Divider />}
              </Box>
            );
          })
        )}
      </Paper>
    </Box>
  );
}
