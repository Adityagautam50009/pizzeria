import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert,
  Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { getMonthlyRevenue, getRevenueSummary } from '../../api/api';

export default function AdminRevenue() {
  var currentYear = new Date().getFullYear();
  var [year, setYear] = useState(currentYear);
  var [monthly, setMonthly] = useState([]);
  var [summary, setSummary] = useState(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState('');

  useEffect(function() {
    setLoading(true);
    Promise.all([getMonthlyRevenue(year), getRevenueSummary()])
      .then(function(results) {
        setMonthly(results[0].data.monthly);
        setSummary(results[1].data);
      }).catch(function() { setError('Failed to load revenue data'); })
      .finally(function() { setLoading(false); });
  }, [year]);

  var maxRevenue = monthly.reduce(function(max, m) { return m.revenue > max ? m.revenue : max; }, 1);

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Typography variant="h4" fontWeight={700} color="#00897b" gutterBottom>Revenue</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#fff3e0', textAlign: 'center' }}>
              <TrendingUpIcon sx={{ color: '#00897b', fontSize: 36 }} />
              <Typography variant="h5" fontWeight={700}>₹{summary.totalRevenue}</Typography>
              <Typography color="text.secondary">Total Revenue (Delivered)</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#e3f2fd', textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={700}>{summary.totalOrders}</Typography>
              <Typography color="text.secondary">Total Orders</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#fff8e1', textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={700}>{summary.pendingOrders}</Typography>
              <Typography color="text.secondary">Pending Orders</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Year Selector */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>Monthly Breakdown</Typography>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Year</InputLabel>
          <Select value={year} label="Year" onChange={function(e) { setYear(e.target.value); }}>
            {[currentYear, currentYear - 1, currentYear - 2].map(function(y) {
              return <MenuItem key={y} value={y}>{y}</MenuItem>;
            })}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress sx={{ color: '#00897b' }} /></Box>
      ) : (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          {/* Visual bar chart */}
          <Box sx={{ p: 3, bgcolor: '#fafafa' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 140, overflowX: 'auto' }}>
              {monthly.map(function(m) {
                var barHeight = m.revenue > 0 ? Math.max(8, (m.revenue / maxRevenue) * 120) : 4;
                return (
                  <Box key={m.month} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 44 }}>
                    <Typography variant="caption" color="#00897b" fontWeight={700} sx={{ mb: 0.5 }}>
                      {m.revenue > 0 ? '₹' + m.revenue : ''}
                    </Typography>
                    <Box sx={{ width: 28, height: barHeight, bgcolor: m.revenue > 0 ? '#00897b' : '#eee', borderRadius: '4px 4px 0 0', transition: 'height 0.4s' }} />
                    <Typography variant="caption" sx={{ mt: 0.5 }}>{m.month}</Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Table */}
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><b>Month</b></TableCell>
                <TableCell align="right"><b>Orders</b></TableCell>
                <TableCell align="right"><b>Revenue</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {monthly.map(function(m) {
                return (
                  <TableRow key={m.month} hover sx={{ bgcolor: m.revenue > 0 ? 'inherit' : '#fafafa' }}>
                    <TableCell>{m.month}</TableCell>
                    <TableCell align="right">{m.orderCount}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: m.revenue > 0 ? 700 : 400, color: m.revenue > 0 ? '#00897b' : 'text.secondary' }}>
                      {m.revenue > 0 ? '₹' + m.revenue : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
