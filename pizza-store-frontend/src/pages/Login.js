import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button,
  Alert, CircularProgress, Link, InputAdornment, IconButton, Stack
} from '@mui/material';
import LocalPizzaIcon from '@mui/icons-material/LocalPizza';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  var { login } = useAuth();
  var navigate = useNavigate();
  var [form, setForm] = useState({ email: '', password: '' });
  var [errors, setErrors] = useState({});
  var [apiError, setApiError] = useState('');
  var [loading, setLoading] = useState(false);
  var [showPass, setShowPass] = useState(false);
  var [touched, setTouched] = useState({});

  // Validation rules
  function validateEmail(email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Enter a valid email address';
    return '';
  }

  function validatePassword(password) {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  }

  function validateForm() {
    var newErrors = {};
    var emailError = validateEmail(form.email);
    var passwordError = validatePassword(form.password);

    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleChange(e) {
    var { name, value } = e.target;
    setForm(function(prev) { return { ...prev, [name]: value }; });
    // Clear error for this field when user starts typing
    if (touched[name]) {
      var fieldError = name === 'email' ? validateEmail(value) : validatePassword(value);
      setErrors(function(prev) { return { ...prev, [name]: fieldError }; });
    }
  }

  function handleBlur(e) {
    var { name } = e.target;
    setTouched(function(prev) { return { ...prev, [name]: true }; });
    // Validate on blur
    var fieldError = name === 'email' ? validateEmail(form[name]) : validatePassword(form[name]);
    setErrors(function(prev) { return { ...prev, [name]: fieldError }; });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) return;

    setLoading(true);
    loginUser(form).then(function(res) {
      login(res.data.token, res.data.user);
      if (res.data.user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/menu');
    }).catch(function(err) {
      setApiError(err.response?.data?.message || 'Login failed. Please try again.');
    }).finally(function() { setLoading(false); });
  }

  var isFormValid = form.email && form.password && !errors.email && !errors.password;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Paper elevation={4} sx={{ p: { xs: 3, sm: 5 }, width: '100%', maxWidth: { xs: 320, sm: 420 }, borderRadius: 3, borderTop: '4px solid #00897b' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <LocalPizzaIcon sx={{ fontSize: { xs: 40, sm: 48 }, color: '#00897b', mb: 1 }} />
          <Typography variant="h5" fontWeight={700} color="#00897b" sx={{ fontSize: { xs: '1.4rem', sm: '1.5rem' } }}>PizzaStore</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>Welcome back! Please login.</Typography>
        </Box>

        {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Box>
              <TextField
                fullWidth label="Email" name="email" type="email"
                value={form.email} onChange={handleChange} onBlur={handleBlur}
                size="small"
                error={Boolean(errors.email && touched.email)}
                helperText={touched.email && errors.email}
                placeholder="you@example.com"
                sx={{ width: '100%' }}
              />
              {form.email && !errors.email && touched.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: '#388e3c' }}>
                  <CheckCircleIcon sx={{ fontSize: 18 }} />
                  <Typography variant="caption">Valid email</Typography>
                </Box>
              )}
            </Box>

            <Box>
              <TextField
                fullWidth label="Password" name="password"
                type={showPass ? 'text' : 'password'}
                value={form.password} onChange={handleChange} onBlur={handleBlur}
                size="small"
                error={Boolean(errors.password && touched.password)}
                helperText={touched.password && errors.password}
                placeholder="Enter your password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={function() { setShowPass(!showPass); }} size="small" edge="end">
                        {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              {form.password && !errors.password && touched.password && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: '#388e3c' }}>
                  <CheckCircleIcon sx={{ fontSize: 18 }} />
                  <Typography variant="caption">Password strength: Good</Typography>
                </Box>
              )}
            </Box>

            <Button
              type="submit" fullWidth variant="contained"
              disabled={loading || !isFormValid}
              sx={{ py: 1.2, borderRadius: 2, fontSize: '1rem' }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Login'}
            </Button>
          </Stack>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
            Don't have an account?{' '}
            <Link href="/register" underline="hover" sx={{ color: '#00897b', fontWeight: 600, cursor: 'pointer' }}>Register</Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
