import React, { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, Button, Dialog, DialogContent,  DialogActions, Grid, TextField, FormControl, InputLabel, Select,  MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Chip, IconButton, Tooltip, Alert, Snackbar, CircularProgress,  useTheme, InputAdornment, LinearProgress, Checkbox, FormControlLabel,
} from '@mui/material';
import { 
  Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Refresh as RefreshIcon, VpnKey as VpnKeyIcon, Search as SearchIcon, 
  Close as CloseIcon, Save as SaveIcon, Security as SecurityIcon, Lock as LockIcon, LockOpen as LockOpenIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { defaultSnackState } from '../formFunctions/FormFunctions';
import displaySnackState from '../customisedSnackBar/DisplaySnackState';
import CustomisedSnackBar from '../customisedSnackBar/CustomisedSnackBar';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#f8f9fa',
  '& .MuiTableHead-root': {
    backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#e8eaed',
  },
  '& .MuiTableRow-root': {
    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa',
    '&:nth-of-type(even)': {
      backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f0f1f3',
    },
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? '#333333' : '#e8eaed',
    },
  },
  '& .MuiTableCell-root': {
    borderBottom: theme.palette.mode === 'dark' ? '1px solid #333333' : '1px solid #e0e0e0',
    color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#333333',
  },
  '& .MuiTableHead-root .MuiTableCell-root': {
    fontWeight: 600,
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#333333',
  },
}));

const ManagePermissions = ({ 
  permissions = [], 
  loading = false,
  onRefresh,
  onPermissionCreated,
  onPermissionUpdated,
  onPermissionDeleted,
  apiClient, urlRoot,
}) => {
  const theme = useTheme();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [formData, setFormData] = useState({ module: '', action: '', description: '', isProtected: false });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPermissions, setFilteredPermissions] = useState([]);
  const [snackState, setSnackState] = useState(defaultSnackState);

  useEffect(() => {
    if (searchTerm) {
      const filtered = permissions.filter(perm =>
        perm.module?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perm.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perm.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPermissions(filtered);
    } else { setFilteredPermissions(permissions);  }
  }, [permissions, searchTerm]);

  const isPermissionProtected = (permission) => {
    if (!permission) return false;
    if (typeof permission.isProtected === 'boolean') { return permission.isProtected === true; }
    return false;
  };

  const handleOpenDialog = (permission = null) => {
    if (permission) {
      const isProtected = isPermissionProtected(permission);
      setEditingPermission(permission);
      setFormData({
        module: permission.module || '',
        action: permission.action || '',
        description: permission.description || '',
        isProtected: isProtected,
      });
    } else {
      setEditingPermission(null);
      setFormData({ module: '', action: '', description: '', isProtected: false, });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPermission(null);
    setFormData({ module: '', action: '', description: '', isProtected: false, });
    setFormErrors({});
  };

  const handleFormChange = (field) => (event) => {
    if (field === 'isProtected') {
      setFormData({ ...formData, [field]: event.target.checked, });
    } else {
      setFormData({ ...formData, [field]: event.target.value, });
    }
    if (formErrors[field]) { setFormErrors({ ...formErrors, [field]: '', }); }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;
    if (!formData.module.trim()) {
      errors.module = 'Module is required';
      isValid = false;
    }
    if (!formData.action.trim()) {
      errors.action = 'Action is required';
      isValid = false;
    }
    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitLoading(true);
    try {
      let response;
      const payload = {
        module: formData.module,
        action: formData.action,
        description: formData.description,
        isProtected: formData.isProtected,
      };
      if (editingPermission) {
        if (isPermissionProtected(editingPermission)) {
          displaySnackState('Cannot update protected permission', 'warning', setSnackState);
          setSubmitLoading(false);
          return;
        }
        response = await apiClient.put(`${urlRoot}/api/permissions/${editingPermission.id || editingPermission._id}`, payload);
        if (response.data.success) {
          displaySnackState("Permission updated successfully", 'success', setSnackState);
          if (onPermissionUpdated) onPermissionUpdated(response.data.data);
        }
      } else {
        response = await apiClient.post(`${urlRoot}/api/permissions`, payload);
        if (response.data.success) {
          displaySnackState("Permission added successfully", 'success', setSnackState);
          if (onPermissionCreated) onPermissionCreated(response.data.data);
        }
      }
      handleCloseDialog();
      if (onRefresh) onRefresh();
    } catch (error) {
      const errorMsg = error.response?.data || 'Failed to save permission';
      displaySnackState(errorMsg, 'error', setSnackState);
    } finally { setSubmitLoading(false); }
  };

  const handleDeletePermission = async (permissionId) => {
    const permission = permissions.find(p => (p.id || p._id) === permissionId);
    if (permission && isPermissionProtected(permission)) {
      displaySnackState('Cannot delete protected permission', 'warning', setSnackState);
      return;
    }
    if (!window.confirm('Are you sure you want to delete this permission? This will remove it from all roles.')) { return; }
    setSubmitLoading(true);
    try {
      const response = await apiClient.delete(`${urlRoot}/api/permissions/${permissionId}`);
      if (response.data.success) {
        displaySnackState("Permission deleted successfully", 'success', setSnackState);
        if (onPermissionDeleted) onPermissionDeleted(permissionId);
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      const errorMsg = error.response?.data || 'Failed to delete Permission';
      displaySnackState(errorMsg, 'error', setSnackState);
    } finally { setSubmitLoading(false); }
  };

  return (
    <Box>
      <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}> Available Permissions </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={onRefresh} disabled={loading} > Refresh </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} > Add Permission </Button>
        </Box>
      </Box>
      <TextField
        placeholder="Search permissions by module, action, or description..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        size="small"
        fullWidth
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"> <SearchIcon /> </InputAdornment>
          ),
        }}
      />
      <StyledTableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '20%' }}>Module</TableCell>
              <TableCell sx={{ width: '20%' }}>Action</TableCell>
              <TableCell sx={{ width: '30%' }}>Description</TableCell>
              <TableCell sx={{ width: '15%' }}>Status</TableCell>
              <TableCell sx={{ width: '15%', textAlign: 'right' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress size={30} />
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                    Loading permissions...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredPermissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                  <VpnKeyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body1" color="text.secondary">
                    {searchTerm ? 'No permissions match your search' : 'No permissions available'}
                  </Typography>
                  {!searchTerm && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenDialog()}
                      sx={{ mt: 2 }}
                    >
                      Create First Permission
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredPermissions.map((permission) => {
                const isProtected = isPermissionProtected(permission);   
                return (
                  <TableRow key={permission.id || permission._id}>
                    <TableCell>
                      <Chip
                        label={permission.module}
                        size="small"
                        sx={{
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#d5d8dd',
                          color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#333333',
                          fontWeight: 500, textTransform: 'capitalize',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={permission.action}
                        size="small"
                        sx={{
                          backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#e8eaed',
                          fontWeight: 500,
                          textTransform: 'capitalize',
                          color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#333333',
                        }}
                      />
                    </TableCell>
                    <TableCell>{permission.description || '-'}</TableCell>
                    <TableCell>
                      {isProtected ? (
                        <Chip
                          icon={<LockIcon />}
                          label="Protected"
                          size="small"
                          color="warning"
                          variant="filled"
                        />
                      ) : (
                        <Chip
                          icon={<LockOpenIcon />}
                          label="Modifiable"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Tooltip title={isProtected ? 'Protected permission cannot be edited' : 'Edit Permission'}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(permission)}
                            disabled={isProtected} // ✅ Disable if protected
                            sx={{ color: theme.palette.primary.main }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={isProtected ? 'Protected permission cannot be deleted' : 'Delete Permission'}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleDeletePermission(permission.id || permission._id)}
                            disabled={isProtected}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </StyledTableContainer>
      {submitLoading && (
        <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }} />
      )}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3, p: 0, overflow: 'hidden',
            backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
          }
        }}
      >
        <Box
          sx={{
            p: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            display: 'flex', alignItems: 'center', gap: 1.5,
          }}
        >
          <VpnKeyIcon sx={{ color: '#fff', fontSize: 28 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
              {editingPermission ? 'Edit Permission' : 'Create New Permission'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              {editingPermission ? 'Update permission details' : 'Define a new permission for the system'}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 3, pt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Module"
                value={formData.module}
                onChange={handleFormChange('module')}
                error={!!formErrors.module}
                helperText={formErrors.module}
                required
                placeholder="e.g., users, invoices, customers"
                size="small"
                disabled={editingPermission ? isPermissionProtected(editingPermission) : false}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small" error={!!formErrors.action}>
                <InputLabel>Action</InputLabel>
                <Select
                  value={formData.action}
                  onChange={handleFormChange('action')}
                  label="Action"
                  required
                  disabled={editingPermission ? isPermissionProtected(editingPermission) : false}
                >
                  <MenuItem value="read">Read</MenuItem>
                  <MenuItem value="create">Create</MenuItem>
                  <MenuItem value="update">Update</MenuItem>
                  <MenuItem value="delete">Delete</MenuItem>
                  <MenuItem value="write">Write</MenuItem>
                  <MenuItem value="export">Export</MenuItem>
                  <MenuItem value="import">Import</MenuItem>
                  <MenuItem value="approve">Approve</MenuItem>
                  <MenuItem value="edit">Edit</MenuItem>
                </Select>
                {formErrors.action && (
                  <Typography variant="caption" color="error"> {formErrors.action} </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleFormChange('description')}
                placeholder="Describe what this permission allows"
                multiline
                rows={2}
                size="small"
                disabled={editingPermission ? isPermissionProtected(editingPermission) : false}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isProtected}
                    onChange={handleFormChange('isProtected')}
                    name="isProtected"
                    color="primary"
                    disabled={editingPermission ? isPermissionProtected(editingPermission) : false}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon fontSize="small" color={formData.isProtected ? 'warning' : 'action'} />
                    <Typography variant="body2">
                      {formData.isProtected ? 'Protected (Cannot be edited or deleted)' : 'Modifiable (Can be edited or deleted)'}
                    </Typography>
                  </Box>
                }
              />
              {editingPermission && isPermissionProtected(editingPermission) && (
                <Alert severity="info" sx={{ mt: 1 }} icon={<LockIcon />}>
                  This permission is protected and cannot be modified
                </Alert>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button fullWidth variant="outlined" onClick={handleCloseDialog} disabled={submitLoading} > Cancel </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleSubmit}
            disabled={ submitLoading || !formData.module || !formData.action || (editingPermission ? isPermissionProtected(editingPermission) : false) }
            startIcon={submitLoading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(25, 118, 210, 0.4)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {submitLoading ? 'Saving...' : editingPermission ? 'Update Permission' : 'Create Permission'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManagePermissions;