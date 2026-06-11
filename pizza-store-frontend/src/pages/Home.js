import React from 'react';
import { Box, Typography, Button, Grid, Paper, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  var { user } = useAuth();
  var navigate = useNavigate();

  var features = [
    { emoji: '🍕', title: 'Fresh Pizzas', desc: 'Hand-crafted daily with premium ingredients and our secret sauce recipe.' },
    { emoji: '🚚', title: 'Fast Delivery', desc: 'Hot and fresh to your doorstep. Track your order in real time.' },
    { emoji: '💳', title: 'Easy Payment', desc: 'Cash, Card, or UPI — pay the way you like, fully secure.' }
  ];

  var categories = [
    { emoji: '🍕', label: 'Pizzas' }, { emoji: '🍟', label: 'Sides' },
    { emoji: '🥤', label: 'Beverages' }, { emoji: '🎁', label: 'Combos' },
    { emoji: '✨', label: 'New Launches' }, { emoji: '⭐', label: 'Bestsellers' }
  ];

  return (
    <Box>
      {/* Hero */}
      <Box sx={{
        background: 'linear-gradient(135deg, #00897b 0%, #00695c 60%, #004d40 100%)',
        color: 'white', py: { xs: 8, md: 14 }, textAlign: 'center', px: 2
      }}>
        <Typography sx={{ fontSize: { xs: 48, md: 72 }, mb: 1 }}>🍕</Typography>
        <Typography variant="h3" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
          Hot. Fresh. Delicious.
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, maxWidth: 500, mx: 'auto', fontSize: { xs: '1rem', md: '1.2rem' } }}>
          Order your favourite pizza in just a few clicks. Delivered fast, every time.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" size="large"
            sx={{ bgcolor: 'white', color: '#00897b', fontWeight: 800, '&:hover': { bgcolor: '#f5f5f5' }, borderRadius: 3, px: 4, py: 1.5, fontSize: 16 }}
            onClick={function () { navigate(user ? '/menu' : '/register'); }}>
            {user ? '🍕 Order Now' : '🚀 Get Started'}
          </Button>
          {!user && (
            <Button variant="outlined" size="large" color="inherit"
              sx={{ borderColor: 'rgba(255,255,255,0.7)', borderRadius: 3, px: 4, py: 1.5, fontSize: 16 }}
              onClick={function () { navigate('/login'); }}>
              Login
            </Button>
          )}
        </Box>
      </Box>

      {/* Categories Strip */}
      <Box sx={{ bgcolor: '#fff3e0', py: 3, px: 2 }}>
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 2, sm: 4 }, flexWrap: 'wrap' }}>
            {categories.map(function (cat) {
              return (
                <Box key={cat.label} sx={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={function () { navigate(user ? '/menu' : '/login'); }}>
                  <Typography sx={{ fontSize: 32 }}>{cat.emoji}</Typography>
                  <Typography variant="caption" fontWeight={600} color="text.secondary">{cat.label}</Typography>
                </Box>
              );
            })}
          </Box>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>Why PizzaStore?</Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 5 }}>
          We don't just make pizza — we make moments.
        </Typography>
        <Grid container spacing={3}>
          {features.map(function (f) {
            return (
              <Grid item xs={12} sm={4} key={f.title}>
                <Paper elevation={0} sx={{ p: 4, borderRadius: 4, textAlign: 'center', border: '1px solid #eee', height: '100%', '&:hover': { boxShadow: 4, borderColor: '#00897b' }, transition: 'all 0.2s' }}>
                  <Typography sx={{ fontSize: 52, mb: 2 }}>{f.emoji}</Typography>
                  <Typography variant="h6" fontWeight={700} gutterBottom>{f.title}</Typography>
                  <Typography color="text.secondary" variant="body2">{f.desc}</Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      {/* CTA */}
      {!user && (
        <Box sx={{ bgcolor: '#00897b', color: 'white', py: 8, textAlign: 'center', px: 2 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>Ready to order?</Typography>
          <Typography sx={{ mb: 4, opacity: 0.9 }}>Create a free account and get your first pizza in minutes.</Typography>
          <Button variant="contained" size="large"
            sx={{ bgcolor: 'white', color: '#00897b', fontWeight: 800, borderRadius: 3, px: 5, '&:hover': { bgcolor: '#f5f5f5' } }}
            onClick={function () { navigate('/register'); }}>
            Sign Up Free
          </Button>
        </Box>
      )}

      {/* Footer */}
      <Box sx={{ bgcolor: '#212121', color: '#aaa', py: 3, textAlign: 'center' }}>
        <Typography variant="body2">© 2026 Pizzeria. All rights reserved. 🍕</Typography>
      </Box>
    </Box>
  );
}
