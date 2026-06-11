import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Chip, Switch,
  FormControlLabel, Alert, CircularProgress, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '../../api/api';

var CATEGORIES = ['pizza', 'sides', 'beverages', 'combo', 'new launches', 'bestsellers'];
var SIZES = ['small', 'medium', 'large', 'regular', 'N/A'];

var EMPTY_FORM = { name: '', description: '', price: '', category: 'pizza', size: 'medium', isAvailable: true };

export default function AdminMenu() {
  var [items, setItems] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState('');
  var [dialogOpen, setDialogOpen] = useState(false);
  var [editingItem, setEditingItem] = useState(null);
  var [form, setForm] = useState(EMPTY_FORM);
  var [saving, setSaving] = useState(false);
  var [deleteConfirm, setDeleteConfirm] = useState(null);

  function fetchItems() {
    setLoading(true);
    getMenuItems().then(function(res) { setItems(res.data); })
      .catch(function() { setError('Failed to load items'); })
      .finally(function() { setLoading(false); });
  }

  useEffect(function() { fetchItems(); }, []);

  function openAdd() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(item) {
    setEditingItem(item);
    setForm({ name: item.name, description: item.description || '', price: item.price, category: item.category, size: item.size, isAvailable: item.isAvailable });
    setDialogOpen(true);
  }

  function handleFormChange(e) {
    var val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(function(prev) { return { ...prev, [e.target.name]: val }; });
  }

  function handleSave() {
    if (!form.name || !form.price || !form.category) { setError('Name, price and category required'); return; }
    setSaving(true); setError('');
    var promise = editingItem ? updateMenuItem(editingItem._id, form) : createMenuItem(form);
    promise.then(function() {
      setDialogOpen(false);
      fetchItems();
    }).catch(function(err) {
      setError(err.response?.data?.message || 'Save failed');
    }).finally(function() { setSaving(false); });
  }

  function handleDelete(id) {
    deleteMenuItem(id).then(function() {
      setDeleteConfirm(null);
      fetchItems();
    }).catch(function() { setError('Delete failed'); });
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700} color="#00897b">Manage Menu</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
          sx={{ bgcolor: '#00897b', '&:hover': { bgcolor: '#004d40' }, borderRadius: 2 }}>
          Add Item
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress sx={{ color: '#00897b' }} /></Box>
      ) : (
        <Paper sx={{ borderRadius: 3, overflow: 'auto' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#fafafa' }}>
              <TableRow>
                <TableCell fontWeight={700}><b>Name</b></TableCell>
                <TableCell><b>Category</b></TableCell>
                <TableCell><b>Price</b></TableCell>
                <TableCell><b>Size</b></TableCell>
                <TableCell><b>Available</b></TableCell>
                <TableCell align="right"><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(function(item) {
                return (
                  <TableRow key={item._id} hover>
                    <TableCell>{item.name}</TableCell>
                    <TableCell><Chip label={item.category} size="small" /></TableCell>
                    <TableCell>₹{item.price}</TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell>
                      <Chip label={item.isAvailable ? 'Yes' : 'No'} color={item.isAvailable ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={function() { openEdit(item); }}><EditIcon /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={function() { setDeleteConfirm(item._id); }}><DeleteIcon /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={function() { setDialogOpen(false); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#00897b', color: 'white' }}>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Name" name="name" value={form.name} onChange={handleFormChange} size="small" fullWidth required />
          <TextField label="Description" name="description" value={form.description} onChange={handleFormChange} size="small" fullWidth multiline rows={2} />
          <TextField label="Price (₹)" name="price" type="number" value={form.price} onChange={handleFormChange} size="small" fullWidth required />
          <FormControl size="small" fullWidth>
            <InputLabel>Category</InputLabel>
            <Select name="category" value={form.category} label="Category" onChange={handleFormChange}>
              {CATEGORIES.map(function(c) { return <MenuItem key={c} value={c}>{c}</MenuItem>; })}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>Size</InputLabel>
            <Select name="size" value={form.size} label="Size" onChange={handleFormChange}>
              {SIZES.map(function(s) { return <MenuItem key={s} value={s}>{s}</MenuItem>; })}
            </Select>
          </FormControl>
          <FormControlLabel
            control={<Switch name="isAvailable" checked={form.isAvailable} onChange={handleFormChange} color="success" />}
            label="Available"
          />
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={function() { setDialogOpen(false); }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ bgcolor: '#00897b', '&:hover': { bgcolor: '#004d40' } }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={Boolean(deleteConfirm)} onClose={function() { setDeleteConfirm(null); }}>
        <DialogTitle>Delete Item?</DialogTitle>
        <DialogContent><Typography>This cannot be undone.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={function() { setDeleteConfirm(null); }}>Cancel</Button>
          <Button color="error" variant="contained" onClick={function() { handleDelete(deleteConfirm); }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
