import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button,
  Alert, CircularProgress, Link, Grid, Stack, LinearProgress, Tooltip, FormHelperText
} from '@mui/material';
import LocalPizzaIcon from '@mui/icons-material/LocalPizza';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  var { login } = useAuth();
  var navigate = useNavigate();
  var [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', address: '' });
  var [errors, setErrors] = useState({});
  var [apiError, setApiError] = useState('');
  var [loading, setLoading] = useState(false);
  var [touched, setTouched] = useState({});

  // Validation functions
  function validateName(name) {
    if (!name) return 'Full name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    if (!/^[a-zA-Z\s]+$/.test(name)) return 'Name should only contain letters and spaces';
    return '';
  }

  function validateEmail(email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Enter a valid email address';
    return '';
  }

  function validatePassword(password) {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number';
    return '';
  }

  function validateConfirmPassword(confirmPassword) {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== form.password) return 'Passwords do not match';
    return '';
  }

  function validatePhone(phone) {
    if (phone && !/^\d{10}$/.test(phone.replace(/\s/g, ''))) {
      return 'Phone must be 10 digits';
    }
    return '';
  }

  function getPasswordStrength(password) {
    if (!password) return 0;
    var strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    if (/[!@#$%^&*]/.test(password)) strength += 25;
    return strength;
  }

  function handleChange(e) {
    var { name, value } = e.target;
    setForm(function(prev) { return { ...prev, [name]: value }; });
    
    // Real-time validation for touched fields
    if (touched[name]) {
      var fieldError = '';
      if (name === 'name') fieldError = validateName(value);
      else if (name === 'email') fieldError = validateEmail(value);
      else if (name === 'password') fieldError = validatePassword(value);
      else if (name === 'confirmPassword') fieldError = validateConfirmPassword(value);
      else if (name === 'phone') fieldError = validatePhone(value);
      
      setErrors(function(prev) { return { ...prev, [name]: fieldError }; });
    }
  }

  function handleBlur(e) {
    var { name } = e.target;
    setTouched(function(prev) { return { ...prev, [name]: true }; });
    
    var fieldError = '';
    if (name === 'name') fieldError = validateName(form[name]);
    else if (name === 'email') fieldError = validateEmail(form[name]);
    else if (name === 'password') fieldError = validatePassword(form[name]);
    else if (name === 'confirmPassword') fieldError = validateConfirmPassword(form[name]);
    else if (name === 'phone') fieldError = validatePhone(form[name]);
    
    setErrors(function(prev) { return { ...prev, [name]: fieldError }; });
  }

  function validateForm() {
    var newErrors = {};
    newErrors.name = validateName(form.name);
    newErrors.email = validateEmail(form.email);
    newErrors.password = validatePassword(form.password);
    newErrors.confirmPassword = validateConfirmPassword(form.confirmPassword);
    if (form.phone) newErrors.phone = validatePhone(form.phone);
    
    Object.keys(newErrors).forEach(function(key) {
      if (!newErrors[key]) delete newErrors[key];
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    registerUser(form).then(function(res) {
      login(res.data.token, res.data.user);
      navigate('/menu');
    }).catch(function(err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
    }).finally(function() { setLoading(false); });
  }

  var passwordStrength = getPasswordStrength(form.password);
  var isFormValid = form.name && form.email && form.password && form.confirmPassword && 
                    !errors.name && !errors.email && !errors.password && !errors.confirmPassword && 
                    (!form.phone || !errors.phone);

  function renderFieldStatus(fieldName) {
    if (!touched[fieldName]) return null;
    if (errors[fieldName]) {
      return <ErrorIcon sx={{ fontSize: 18, color: '#d32f2f' }} />;
    }
    return <CheckCircleIcon sx={{ fontSize: 18, color: '#388e3c' }} />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, py: 4 }}>
      <Paper elevation={4} sx={{ p: { xs: 2.5, sm: 4 }, width: '100%', maxWidth: { xs: 320, sm: 500 }, borderRadius: 3, borderTop: '4px solid #00897b' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <LocalPizzaIcon sx={{ fontSize: { xs: 40, sm: 48 }, color: '#00897b', mb: 1 }} />
          <Typography variant="h5" fontWeight={700} color="#00897b" sx={{ fontSize: { xs: '1.4rem', sm: '1.5rem' } }}>Create Account</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>Join PizzaStore today</Typography>
        </Box>

        {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            {/* Name Field */}
            <Grid item xs={12}>
              <TextField
                fullWidth label="Full Name" name="name"
                value={form.name} onChange={handleChange} onBlur={handleBlur}
                size="small"
                error={Boolean(errors.name && touched.name)}
                helperText={touched.name && errors.name}
                placeholder="John Doe"
                InputProps={{
                  endAdornment: renderFieldStatus('name')
                }}
              />
            </Grid>

            {/* Email Field */}
            <Grid item xs={12}>
              <TextField
                fullWidth label="Email" name="email" type="email"
                value={form.email} onChange={handleChange} onBlur={handleBlur}
                size="small"
                error={Boolean(errors.email && touched.email)}
                helperText={touched.email && errors.email}
                placeholder="you@example.com"
                InputProps={{
                  endAdornment: renderFieldStatus('email')
                }}
              />
            </Grid>

            {/* Password Field */}
            <Grid item xs={12}>
              <TextField
                fullWidth label="Password" name="password" type="password"
                value={form.password} onChange={handleChange} onBlur={handleBlur}
                size="small"
                error={Boolean(errors.password && touched.password)}
                helperText={touched.password && errors.password}
                placeholder="Min 6 chars: A, a, 0"
                InputProps={{
                  endAdornment: renderFieldStatus('password')
                }}
              />
              {form.password && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Password strength:</Typography>
                    <Typography variant="caption" sx={{ color: passwordStrength <= 25 ? '#d32f2f' : passwordStrength <= 50 ? '#f57c00' : passwordStrength <= 75 ? '#fbc02d' : '#388e3c', fontWeight: 600 }}>
                      {passwordStrength <= 25 ? 'Weak' : passwordStrength <= 50 ? 'Fair' : passwordStrength <= 75 ? 'Good' : 'Strong'}
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={passwordStrength} sx={{ height: 6, borderRadius: 3 }} />
                </Box>
              )}
            </Grid>

            {/* Confirm Password Field */}
            <Grid item xs={12}>
              <TextField
                fullWidth label="Confirm Password" name="confirmPassword" type="password"
                value={form.confirmPassword} onChange={handleChange} onBlur={handleBlur}
                size="small"
                error={Boolean(errors.confirmPassword && touched.confirmPassword)}
                helperText={touched.confirmPassword && errors.confirmPassword}
                placeholder="Confirm your password"
                InputProps={{
                  endAdornment: renderFieldStatus('confirmPassword')
                }}
              />
            </Grid>

            {/* Phone Field */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Phone (optional)" name="phone"
                value={form.phone} onChange={handleChange} onBlur={handleBlur}
                size="small"
                error={Boolean(errors.phone && touched.phone)}
                helperText={touched.phone && errors.phone}
                placeholder="9876543210"
                InputProps={{
                  endAdornment: renderFieldStatus('phone')
                }}
              />
            </Grid>

            {/* Address Field */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Address (optional)" name="address"
                value={form.address} onChange={handleChange}
                size="small"
                placeholder="123 Main St"
              />
            </Grid>
          </Grid>

          <Button
            type="submit" fullWidth variant="contained"
            disabled={loading || !isFormValid}
            sx={{ mt: 3, py: 1.2, borderRadius: 2, fontSize: '1rem' }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Create Account'}
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
            Already have an account?{' '}
            <Link href="/login" underline="hover" sx={{ color: '#00897b', fontWeight: 600, cursor: 'pointer' }}>Login</Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
