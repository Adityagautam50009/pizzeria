import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Alert,
  CircularProgress, Grid, Avatar, Divider, Chip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  var { user, login, logout } = useAuth();
  var navigate = useNavigate();
  var [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '', password: '' });
  var [success, setSuccess] = useState('');
  var [error, setError] = useState('');
  var [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(function(prev) { return { ...prev, [e.target.name]: e.target.value }; });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setLoading(true); setError(''); setSuccess('');
    var data = { name: form.name, phone: form.phone, address: form.address };
    if (form.password) data.password = form.password;
    updateProfile(data).then(function(res) {
      login(localStorage.getItem('token'), res.data.user);
      setSuccess('Profile updated successfully!');
      setForm(function(prev) { return { ...prev, password: '' }; });
    }).catch(function(err) {
      setError(err.response?.data?.message || 'Update failed');
    }).finally(function() { setLoading(false); });
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Typography variant="h4" fontWeight={700} color="#00897b" gutterBottom>My Profile</Typography>

      {/* Profile Card */}
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 72, height: 72, bgcolor: '#00897b', fontSize: 32, fontWeight: 700 }}>
            {user?.name ? user.name[0].toUpperCase() : <PersonIcon />}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>{user?.name}</Typography>
            <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
            <Chip label={user?.role === 'admin' ? '👑 Admin' : '🛒 Customer'} size="small"
              color={user?.role === 'admin' ? 'error' : 'default'} sx={{ mt: 0.5 }} />
          </Box>
        </Box>
      </Paper>

      {/* Edit Form */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>Edit Information</Typography>
        <Divider sx={{ mb: 2 }} />

        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Full Name" name="name" value={form.name} onChange={handleChange} size="small" required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email" value={user?.email || ''} disabled size="small"
                helperText="Email cannot be changed" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone Number" name="phone" value={form.phone} onChange={handleChange} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Delivery Address" name="address" value={form.address} onChange={handleChange} size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="New Password" name="password" type="password"
                value={form.password} onChange={handleChange} size="small"
                helperText="Leave blank to keep current password" />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
            <Button type="submit" variant="contained" disabled={loading}
              sx={{ bgcolor: '#00897b', '&:hover': { bgcolor: '#004d40' }, borderRadius: 2 }}>
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
            </Button>
            <Button variant="outlined" color="error" onClick={handleLogout} sx={{ borderRadius: 2 }}>
              Logout
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
