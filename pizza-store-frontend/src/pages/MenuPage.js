import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardActions, Button,
  Chip, TextField, InputAdornment, CircularProgress, Alert,
  Tabs, Tab, Snackbar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import LocalPizzaIcon from '@mui/icons-material/LocalPizza';
import { getMenuItems } from '../api/api';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

var CATEGORIES = ['all', 'pizza', 'sides', 'beverages', 'combo', 'new launches', 'bestsellers'];
var CATEGORY_EMOJIS = { pizza: '🍕', sides: '🍟', beverages: '🥤', combo: '🎁', 'new launches': '✨', bestsellers: '⭐' };
var CATEGORY_COLORS = { pizza: 'error', sides: 'success', beverages: 'info', combo: 'warning', 'new launches': 'secondary', bestsellers: 'primary' };

export default function MenuPage() {
  var { addToCart, totalItems } = useCart();
  var navigate = useNavigate();
  var [items, setItems] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState('');
  var [search, setSearch] = useState('');
  var [activeTab, setActiveTab] = useState(0);
  var [snack, setSnack] = useState('');

  var category = CATEGORIES[activeTab];

  useEffect(function() {
    setLoading(true);
    var params = {};
    if (category !== 'all') params.category = category;
    if (search) params.search = search;
    getMenuItems(params).then(function(res) {
      setItems(res.data);
    }).catch(function() {
      setError('Failed to load menu. Make sure the backend is running.');
    }).finally(function() { setLoading(false); });
  }, [category, search]);

  function handleAddToCart(item) {
    addToCart(item);
    setSnack(item.name + ' added to cart!');
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight={700} color="#00897b">Our Menu</Typography>
        {totalItems > 0 && (
          <Button variant="contained" onClick={function() { navigate('/cart'); }}
            sx={{ bgcolor: '#00897b', '&:hover': { bgcolor: '#004d40' }, borderRadius: 2 }}>
            🛒 View Cart ({totalItems})
          </Button>
        )}
      </Box>

      {/* Search */}
      <TextField
        placeholder="Search pizzas, sides, drinks..."
        size="small" value={search}
        onChange={function(e) { setSearch(e.target.value); }}
        sx={{ mb: 2, width: { xs: '100%', sm: 340 } }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
      />

      {/* Category Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={function(e, v) { setActiveTab(v); }}
          variant="scrollable" scrollButtons="auto"
          TabIndicatorProps={{ style: { backgroundColor: '#00897b' } }}>
          {CATEGORIES.map(function(cat) {
            return (
              <Tab key={cat}
                label={(CATEGORY_EMOJIS[cat] ? CATEGORY_EMOJIS[cat] + ' ' : '') + cat.charAt(0).toUpperCase() + cat.slice(1)}
                sx={{ textTransform: 'capitalize', fontWeight: 600, '&.Mui-selected': { color: '#00897b' } }}
              />
            );
          })}
        </Tabs>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
          <CircularProgress sx={{ color: '#00897b' }} />
        </Box>
      ) : items.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 10 }}>
          <LocalPizzaIcon sx={{ fontSize: 72, color: '#e0e0e0' }} />
          <Typography color="text.secondary" mt={1}>No items found</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {items.map(function(item) {
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                <Card sx={{
                  height: '100%', display: 'flex', flexDirection: 'column',
                  borderRadius: 3, boxShadow: 2,
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
                }}>
                  <Box sx={{ bgcolor: '#fff3e0', height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <Typography sx={{ fontSize: 60 }}>{CATEGORY_EMOJIS[item.category] || '🍕'}</Typography>
                    {!item.isAvailable && (
                      <Box sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', px: 1, py: 0.3, borderRadius: 1, fontSize: 11 }}>
                        Unavailable
                      </Box>
                    )}
                  </Box>
                  <CardContent sx={{ flexGrow: 1, pb: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3 }}>{item.name}</Typography>
                      <Chip label={item.category} size="small" color={CATEGORY_COLORS[item.category] || 'default'}
                        sx={{ fontSize: 10, height: 20, ml: 0.5, flexShrink: 0 }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12, mb: 0.5 }}>{item.description}</Typography>
                    {item.size !== 'N/A' && (
                      <Typography variant="caption" color="text.secondary">📏 {item.size}</Typography>
                    )}
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2, pt: 1 }}>
                    <Typography variant="h6" fontWeight={800} color="#00897b">₹{item.price}</Typography>
                    <Button variant="contained" size="small" startIcon={<AddShoppingCartIcon />}
                      onClick={function() { handleAddToCart(item); }}
                      disabled={!item.isAvailable}
                      sx={{ bgcolor: '#00897b', '&:hover': { bgcolor: '#004d40' }, borderRadius: 2, textTransform: 'none' }}>
                      Add
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Snackbar open={Boolean(snack)} autoHideDuration={2000} onClose={function() { setSnack(''); }}
        message={snack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
