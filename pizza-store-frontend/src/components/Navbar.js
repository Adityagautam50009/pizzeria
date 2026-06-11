import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, IconButton, Badge,
  Drawer, List, ListItem, ListItemText, Box, Avatar, Menu, MenuItem, Divider, useTheme
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MenuIcon from '@mui/icons-material/Menu';
import LocalPizzaIcon from '@mui/icons-material/LocalPizza';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  var theme = useTheme();
  var { user, logout } = useAuth();
  var { totalItems } = useCart();
  var navigate = useNavigate();
  var location = useLocation();
  var [drawerOpen, setDrawerOpen] = useState(false);
  var [anchorEl, setAnchorEl] = useState(null);

  function handleLogout() {
    logout();
    navigate('/login');
    setAnchorEl(null);
  }

  var customerLinks = [
    { label: 'Menu', path: '/menu' },
    { label: 'My Orders', path: '/orders' },
    { label: 'Profile', path: '/profile' }
  ];

  var adminLinks = [
    { label: 'Dashboard', path: '/admin/dashboard' },
    { label: 'Manage Menu', path: '/admin/menu' },
    { label: 'Manage Orders', path: '/admin/orders' },
    { label: 'Revenue', path: '/admin/revenue' }
  ];

  var links = user ? (user.role === 'admin' ? adminLinks : customerLinks) : [];

  return (
    <>
      <AppBar position="sticky" sx={{ bgcolor: theme.palette.primary.main, boxShadow: '0 2px 8px rgba(0, 137, 123, 0.2)' }}>
        <Toolbar>
          <LocalPizzaIcon sx={{ mr: 1, fontSize: { xs: 28, sm: 32 } }} />
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, cursor: 'pointer', fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
            onClick={function() { navigate(user ? (user.role === 'admin' ? '/admin/dashboard' : '/menu') : '/'); }}
          >
            Pizzeria
          </Typography>

          {/* Desktop links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
            {links.map(function(link) {
              return (
                <Button
                  key={link.path}
                  color="inherit"
                  onClick={function() { navigate(link.path); }}
                  sx={{ fontWeight: location.pathname === link.path ? 700 : 400, borderBottom: location.pathname === link.path ? '2px solid white' : 'none', textTransform: 'none' }}
                >
                  {link.label}
                </Button>
              );
            })}

            {user && user.role === 'customer' && (
              <IconButton color="inherit" onClick={function() { navigate('/cart'); }} sx={{ ml: 1 }}>
                <Badge badgeContent={totalItems} color="warning">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            )}

            {user ? (
              <>
                <Avatar
                  sx={{ width: 36, height: 36, bgcolor: theme.palette.secondary.main, cursor: 'pointer', ml: 2, fontWeight: 600 }}
                  onClick={function(e) { setAnchorEl(e.currentTarget); }}
                >
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </Avatar>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={function() { setAnchorEl(null); }}>
                  <MenuItem disabled><Typography variant="body2" fontWeight={600}>{user.name}</Typography></MenuItem>
                  <MenuItem disabled><Typography variant="caption" color="text.secondary">{user.email}</Typography></MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button color="inherit" onClick={function() { navigate('/login'); }} sx={{ textTransform: 'none' }}>Login</Button>
                <Button variant="outlined" color="inherit" onClick={function() { navigate('/register'); }} sx={{ textTransform: 'none' }}>Register</Button>
              </>
            )}
          </Box>

          {/* Mobile hamburger */}
          <IconButton color="inherit" sx={{ display: { md: 'none' } }} onClick={function() { setDrawerOpen(true); }}>
            <MenuIcon />
          </IconButton>
          {user && user.role === 'customer' && (
            <IconButton color="inherit" sx={{ display: { md: 'none' } }} onClick={function() { navigate('/cart'); }}>
              <Badge badgeContent={totalItems} color="warning">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={function() { setDrawerOpen(false); }}>
        <Box sx={{ width: 280, pt: 2 }}>
          {user && (
            <Box sx={{ px: 2, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: theme.palette.primary.main, mb: 1, fontWeight: 600 }}>
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </Avatar>
              <Typography variant="subtitle1" fontWeight={700}>{user.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>{user.email}</Typography>
            </Box>
          )}
          <List>
            {links.map(function(link) {
              return (
                <ListItem
                  button
                  key={link.path}
                  onClick={function() { navigate(link.path); setDrawerOpen(false); }}
                  sx={{ borderLeft: location.pathname === link.path ? `4px solid ${theme.palette.primary.main}` : 'none', bgcolor: location.pathname === link.path ? 'primary.light' : 'transparent' }}
                >
                  <ListItemText primary={link.label} />
                </ListItem>
              );
            })}
            <Divider />
            {user ? (
              <ListItem
                button
                onClick={handleLogout}
                sx={{ color: 'error.main' }}
              >
                <ListItemText primary="Logout" />
              </ListItem>
            ) : (
              <>
                <ListItem button onClick={function() { navigate('/login'); setDrawerOpen(false); }}>
                  <ListItemText primary="Login" />
                </ListItem>
                <ListItem button onClick={function() { navigate('/register'); setDrawerOpen(false); }}>
                  <ListItemText primary="Register" />
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
