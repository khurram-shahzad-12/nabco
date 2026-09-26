import React, { useState, useEffect } from 'react';
import { Box, Dialog, DialogContent, DialogActions, Grid, TextField, Button, Typography, Avatar, Checkbox, FormControlLabel, Alert, CircularProgress, InputAdornment, IconButton, useTheme, Chip, Divider, Paper, Fade } from '@mui/material';
import {
  AdminPanelSettings as AdminPanelSettingsIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  VpnKey as VpnKeyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Shield as ShieldIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

const RoleDialog = ({ open, onClose, onSuccess, role = null, permissions = [], loadingPermissions = false }) => {
  const theme = useTheme();
  const isEditing = !!role;
  const [loading, setLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});
  const [formData, setFormData] = useState({ name: '', displayName: '', description: '', permissions: [], });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (role && open) {
      setFormData({
        name: role.name || '',
        displayName: role.displayName || '',
        description: role.description || '',
        permissions: role.permissions?.map(p => p.id || p._id) || [],
      });
    } else if (open) { setFormData({ name: '', displayName: '', description: '', permissions: [], }); }
  }, [role, open]);

  useEffect(() => {
    if (!open) {
      setFormErrors({});
      setExpandedModules({});
    }
  }, [open]);

  const groupedPermissions = permissions.reduce((acc, perm) => {
    const module = perm.module || 'Uncategorized';
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(perm);
    return acc;
  }, {});

  const sortedModules = Object.keys(groupedPermissions).sort();
  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value, });
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: '', });
    }
  };

  const handleTogglePermission = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId) ? prev.permissions.filter(p => p !== permissionId) : [...prev.permissions, permissionId],
    }));
  };

  const handleToggleModule = (module) => {
    setExpandedModules(prev => ({ ...prev, [module]: !prev[module], }));
  };

  const handleSelectAllModule = (module) => {
    const modulePermissions = groupedPermissions[module] || [];
    const modulePermissionIds = modulePermissions.map(p => p.id || p._id);
    const allSelected = modulePermissionIds.every(id => formData.permissions.includes(id));

    setFormData(prev => {
      if (allSelected) {
        return {
          ...prev,
          permissions: prev.permissions.filter(id => !modulePermissionIds.includes(id)),
        };
      } else {
        const newPermissions = [...prev.permissions];
        modulePermissionIds.forEach(id => {
          if (!newPermissions.includes(id)) { newPermissions.push(id); }
        });
        return { ...prev, permissions: newPermissions, };
      }
    });
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;
    if (!formData.name.trim()) {
      errors.name = 'Role name is required';
      isValid = false;
    } else if (!/^[a-z_]+$/.test(formData.name)) {
      errors.name = 'Role name must be lowercase with underscores only';
      isValid = false;
    }
    if (!formData.displayName.trim()) {
      errors.displayName = 'Display name is required';
      isValid = false;
    }
    setFormErrors(errors);
    return isValid;
  };
  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await onSuccess(formData);
      onClose();
    } catch (error) { console.error("failed to save role", role);
    } finally { setLoading(false); }
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4, overflow: 'hidden', p: 0,
          bgcolor: theme.palette.background.default, boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        },
      }}
    >
      <Box
        sx={{
          p: 2, position: 'relative', overflow: 'hidden',
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          display: 'flex', alignItems: 'center', gap: 1.5,
        }}
      >
        <Box
          sx={{
            position: 'absolute', top: -40, right: -20, width: 120, height: 120,
            borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
          }} />
        <Box
          sx={{ position: 'absolute', bottom: -50, left: -30, width: 100, height: 100,
            borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none', }} />
        <Avatar
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40,
            height: 40, backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <AdminPanelSettingsIcon sx={{ color: '#fff', fontSize: 20 }} />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600, fontSize: '1rem' }}>
            {isEditing ? 'Edit Role' : 'Create New Role'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem' }}>
            {isEditing ? 'Update role details and permissions' : 'Define a new role and assign permissions'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#fff', p: 0.5 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ p: 3,pt: 2.5, bgcolor: theme.palette.background.default }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Role Name (slug)"
              value={formData.name}
              onChange={handleChange('name')}
              error={!!formErrors.name}
              helperText={formErrors.name || 'Lowercase with underscores (e.g., sales_rep)'}
              required
              disabled={isEditing}
              size="small"
              InputProps={{
                startAdornment: ( <InputAdornment position="start"> <VpnKeyIcon sx={{ fontSize: 18, color: 'action.active' }} /> </InputAdornment> ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Display Name"
              value={formData.displayName}
              onChange={handleChange('displayName')}
              error={!!formErrors.displayName}
              helperText={formErrors.displayName}
              required
              size="small"
              InputProps={{
                startAdornment: ( <InputAdornment position="start" sx={{ ml: -0.5 }}> <ShieldIcon sx={{ fontSize: 18, color: 'action.active' }} /> </InputAdornment> ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description (Optional)"
              value={formData.description}
              onChange={handleChange('description')}
              multiline
              rows={2}
              size="small"
              placeholder="Describe the purpose of this role"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ ml: -0.5, alignSelf: 'flex-start', mt: 1 }}> <SecurityIcon sx={{ fontSize: 18, color: 'action.active' }} /> </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
             <Divider sx={{ my: 1 }}>
              <Chip
                icon={<SecurityIcon sx={{ fontSize: 16 }} />}
                label="Permissions"
                size="small"
                sx={{
                  fontWeight: 600,
                  borderRadius: 1,
                  '& .MuiChip-label': { fontSize: '0.75rem' },
                }}
              />
            </Divider>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} color="text.primary" fontSize="0.875rem">
                Permissions
              </Typography>
              {formData.permissions.length > 0 && (
                <Chip
                  label={`${formData.permissions.length} selected`}
                  size="small"
                  color="primary"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, fontSize: '0.7rem' }}>
              Select the permissions that this role should have
            </Typography>

            <Paper
              variant="outlined"
              sx={{
                maxHeight: 320,
                overflow: 'auto',
                p: 1.5,
                borderRadius: 2,
                bgcolor: theme.palette.background.paper,
                borderColor: theme.palette.divider,
              }}
            >
              {loadingPermissions ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}> <CircularProgress size={30} /> </Box>
              ) : permissions.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 2, fontSize: '0.875rem' }}> No permissions available </Typography>
              ) : (
                sortedModules.map((module) => {
                  const modulePermissions = groupedPermissions[module] || [];
                  const modulePermissionIds = modulePermissions.map(p => p.id || p._id);
                  const allSelected = modulePermissionIds.every(id => formData.permissions.includes(id));
                  const someSelected = modulePermissionIds.some(id => formData.permissions.includes(id));
                  const isExpanded = expandedModules[module] !== false;
                  return (
                    <Box key={module} sx={{ mb: 1.5 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: 0.75, px: 1,
                          bgcolor: theme.palette.action.hover,
                          borderRadius: 1,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: theme.palette.action.selected, },
                        }}
                        onClick={() => handleToggleModule(module)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton size="small" sx={{ color: theme.palette.text.secondary, p: 0.25 }}>
                            {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          </IconButton>
                          <Typography variant="body2" fontWeight={600} textTransform="capitalize" color="text.primary" fontSize="0.8rem">
                            {module}
                          </Typography>
                          <Chip
                            label={`${modulePermissions.length}`}
                            size="small"
                            variant="outlined"
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                checked={allSelected}
                                indeterminate={!allSelected && someSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleSelectAllModule(module);
                                }}
                                sx={{ p: 0.25 }}
                              />
                            }
                            label="Select All"
                            sx={{ mr: 0, '& .MuiFormControlLabel-label': { fontSize: '0.7rem' } }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Box>
                      </Box>
                      {isExpanded && (
                        <Box sx={{ pl: 1.5, pr: 0.5, pt: 0.5 }}>
                          <Grid container spacing={0.5}>
                            {modulePermissions.map((permission) => {
                              const permId = permission.id || permission._id;
                              return (
                                <Grid item xs={12} sm={6} key={permId}>
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        size="small"
                                        checked={formData.permissions.includes(permId)}
                                        onChange={() => handleTogglePermission(permId)}
                                        sx={{ p: 0.25 }}
                                      />
                                    }
                                    label={
                                      <Box>
                                        <Typography variant="body2" fontWeight={500} color="text.primary" fontSize="0.75rem"> {permission.action} </Typography>
                                        {permission.description && (
                                          <Typography variant="caption" color="text.secondary" display="block" fontSize="0.65rem"> {permission.description} </Typography>
                                        )}
                                      </Box>
                                    }
                                    sx={{ m: 0.25 }}
                                  />
                                </Grid>
                              );
                            })}
                          </Grid>
                        </Box>
                      )}
                    </Box>
                  );
                })
              )}
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2, gap: 1, bgcolor: theme.palette.background.default }}>
        <Button
          fullWidth variant="outlined" onClick={onClose}
          disabled={loading} sx={{ borderRadius: 2, py: 1 }} size="small" > Cancel </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={ loading || loadingPermissions || !formData.name || !formData.displayName }
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
          sx={{
            borderRadius: 2, py: 1,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(25, 118, 210, 0.4)',
            },
            transition: 'all 0.3s ease',
          }}
          size="small"
        >
          {loading ? 'Saving...' : isEditing ? 'Update Role' : 'Create Role'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default RoleDialog;