import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT token to every request automatically
api.interceptors.request.use(function(config) {
  var token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

// ── Auth ──────────────────────────────────────────
export function registerUser(data) { return api.post('/auth/register', data); }
export function loginUser(data) { return api.post('/auth/login', data); }
export function getProfile() { return api.get('/auth/profile'); }
export function updateProfile(data) { return api.put('/auth/profile', data); }
export function getAllUsers() { return api.get('/auth/users'); }

// ── Menu ──────────────────────────────────────────
export function getMenuItems(params) { return api.get('/menu', { params }); }
export function getMenuItem(id) { return api.get('/menu/' + id); }
export function createMenuItem(data) { return api.post('/menu', data); }
export function updateMenuItem(id, data) { return api.put('/menu/' + id, data); }
export function deleteMenuItem(id) { return api.delete('/menu/' + id); }

// ── Orders ────────────────────────────────────────
export function placeOrder(data) { return api.post('/orders', data); }
export function getOrders(params) { return api.get('/orders', { params }); }
export function getOrderById(id) { return api.get('/orders/' + id); }
export function cancelOrder(id) { return api.put('/orders/' + id + '/cancel'); }
export function updateOrderStatus(id, data) { return api.put('/orders/' + id + '/status', data); }
export function getOrderBill(id) { return api.get('/orders/' + id + '/bill'); }

// ── Revenue ───────────────────────────────────────
export function getRevenueSummary() { return api.get('/revenue/summary'); }
export function getMonthlyRevenue(year) { return api.get('/revenue/monthly', { params: { year } }); }
