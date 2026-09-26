import React, { useState, useEffect } from 'react';
import { Box, Dialog, DialogContent, DialogActions, Grid, TextField, Button, Typography, Avatar, Chip, Stack, FormControl, InputLabel, Select, MenuItem, FormHelperText, Alert, CircularProgress, InputAdornment, IconButton, useTheme, LinearProgress,Fade } from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AssignmentInd as AssignmentIndIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import axiosDefault from '../axiosDefault/axiosDefault';
import { URL_ROOT } from '../../configs/config';

const RegisterUserDialog = ({ open, onClose, onSuccess, user = null, roles = [], loadingRoles = false, onError }) => {
  const axios = axiosDefault();
  const theme = useTheme();
  const isEditing = !!user;
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    position: '',
    role: '',
    status: 'active',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (user && open) {
      const roleId = user.role?._id || '';
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        phone: user.phone || '',
        position: user.position || '',
        role: roleId,
        status: user.isActive ? 'active' : 'inactive',
      });
    } else if (open) {
      const defaultRole = roles.length > 0 ? (roles[0]._id || roles[0].id) : '';
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        position: '',
        role: defaultRole,
        status: 'active',
      });
    }
  }, [user, open, roles]);

  useEffect(() => {
    if (!open) {
      setFormErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open]);

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
    if (formErrors[field]) {
      setFormErrors({
        ...formErrors,
        [field]: '',
      });
    }
  };

  const handleTogglePassword = () => { setShowPassword(!showPassword); };
  const handleToggleConfirmPassword = () => { setShowConfirmPassword(!showConfirmPassword); };
  const validateForm = () => {
    const errors = {};
    let isValid = true;
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
      isValid = false;
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
      isValid = false;
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }
    if (!isEditing) {
      if (!formData.password) {
        errors.password = 'Password is required';
        isValid = false;
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
        isValid = false;
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
    } else {
      if (formData.password && formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
        isValid = false;
      }
      if (formData.password && formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
    }
    if (!formData.role) {
      errors.role = 'Please select a role';
      isValid = false;
    }
    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      let result;
      if (isEditing) {
        const updateData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          role: formData.role,
          isActive: formData.status === 'active',
        };
        if (formData.password) { updateData.password = formData.password; }
        const userId = user.id || user._id;
        result = await axios.put(`${URL_ROOT}/api/user/${userId}`, updateData)
        if (result.data.success) {
          onSuccess?.('User updated successfully!');
          onClose();
        } else {const errorMsg = result.data.message || 'Failed to update user.'; onError?.(errorMsg); }
      } else {
        const userData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          position: formData.position,
          role: formData.role,
        };
        const result = await axios.post(`${URL_ROOT}/api/user/register`, userData);
        if (result.data.success) {
          onSuccess?.('User registered successfully!');
          onClose();
        } else {console.log(result.data); const errorMsg = result.data || 'Registration failed. Please try again.'; onError?.(errorMsg);  }
      }
    } catch (error) {
      let errorMsg;
      if(error.response) {errorMsg = error.response?.data || 'failed to update' ; onError?.(errorMsg);}
    } finally { setLoading(false); }
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 4, overflow: 'hidden', p: 0, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
      }}
    >
      <Box
        sx={{
          p: 2.5, pr: 2,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          display: 'flex', alignItems: 'center',
          gap: 2, position: 'relative', overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <Avatar
          sx={{
            bgcolor: 'rgba(255,255,255,0.2)',
            width: 40, height: 40, fontSize: 20, backdropFilter: 'blue(4px)', border: '1px solid rgba(255,255,255,0.15)' }} >
          {isEditing ? <EditIcon sx={{fontSize: 22}}/> : <PersonAddIcon sx={{fontSize: 22}}/>}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
            {isEditing ? 'Edit User' : 'Register New User'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            {isEditing ? 'Update user information and permissions' : 'Create a new user account in the system'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#fff','&:hover': { bgcolor: 'rgba(255,255,255,0.15)', transform: 'rotate(90deg)' },
            transition: 'transform 0.3s ease' }} disabled={loading}>
          <CloseIcon  fontSize='smaill'/>
        </IconButton>
      </Box>
      <DialogContent sx={{ p: 3, pt: 2.5 }}>
        {isEditing && (
      <Fade in>
          <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BadgeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Chip
              label={formData.status === 'active' ? 'Active' : 'Inactive'}
              size='small'
              sx={{
                fontWeight: 600,
                backgroundColor:
                  formData.status === 'active' ? '#e8f5e9' : '#ffebee',
                color: formData.status === 'active' ? '#2e7d32' : '#c62828',
              }}
            />
          </Box>
          </Fade>
        )}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              value={formData.firstName}
              onChange={handleChange('firstName')}
              error={!!formErrors.firstName}
              helperText={formErrors.firstName}
              required
              size="small"
              InputProps={{ startAdornment: ( <InputAdornment position="start"> <PersonIcon sx={{color:"action.active", fontSize: 18}} /> </InputAdornment> ), }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              value={formData.lastName}
              onChange={handleChange('lastName')}
              error={!!formErrors.lastName}
              helperText={formErrors.lastName}
              required
              size="small"
              InputProps={{ startAdornment: ( <InputAdornment position="start"> <PersonIcon sx={{color:"action.active", fontSize: 18}} /> </InputAdornment> ), }} />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              error={!!formErrors.email}
              helperText={formErrors.email}
              required
              size="small"
              InputProps={{ startAdornment: ( <InputAdornment position="start"> <EmailIcon sx={{color:"action.active", fontSize: 18}} /> </InputAdornment> ), }} />
          </Grid>
          {/* <Grid item xs={12}>
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phone}
              onChange={handleChange('phone')}
              size="small"
              InputProps={{ startAdornment: ( <InputAdornment position="start"> <PhoneIcon sx={{color:"action.active", fontSize: 18}} /> </InputAdornment> ), }} />
          </Grid> */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={isEditing ? 'New Password (leave blank to keep current)' : 'Password'}
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange('password')}
              error={!!formErrors.password}
              helperText={formErrors.password || 'Minimum 8 characters'}
              required={!isEditing}
              size="small"
              InputProps={{ startAdornment: ( <InputAdornment position="start"> <LockIcon sx={{color:"action.active", fontSize: 18}} /> </InputAdornment> ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleTogglePassword}>
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {formData.password && (
              <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                <Chip
                  label="8+ characters"
                  size="small"
                  color={formData.password.length >= 8 ? 'success' : 'default'}
                  variant={formData.password.length >= 8 ? 'filled' : 'outlined'}
                />
                <Chip
                  label="Contains letters"
                  size="small"
                  color={/[a-zA-Z]/.test(formData.password) ? 'success' : 'default'}
                  variant={/[a-zA-Z]/.test(formData.password) ? 'filled' : 'outlined'}
                />
                <Chip
                  label="Contains numbers"
                  size="small"
                  color={/[0-9]/.test(formData.password) ? 'success' : 'default'}
                  variant={/[0-9]/.test(formData.password) ? 'filled' : 'outlined'}
                />
              </Stack>
            )}
          </Grid>
          {(formData.password || !isEditing) && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword}
                required={!isEditing}
                size="small"
                InputProps={{
                  startAdornment: ( <InputAdornment position="start"> <LockIcon sx={{color:"action.active", fontSize: 18}} /> </InputAdornment> ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleToggleConfirmPassword}>
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography variant="caption" color="success.main" fontWeight={500}> Passwords match </Typography>
                </Box>
              )}
            </Grid>
          )}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Position (Optional)"
              value={formData.position}
              onChange={handleChange('position')}
              size="small"
              InputProps={{ startAdornment: ( <InputAdornment position="start"> <AssignmentIndIcon sx={{color:"action.active", fontSize: 18}} /> </InputAdornment> ), }} />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth required error={!!formErrors.role}>
              <InputLabel>Role</InputLabel>
              <Select value={formData.role} onChange={handleChange('role')} label="Role" disabled={loadingRoles} >
                {roles.map((role) => {
                  const roleId = role._id || role.id;
                  return (
                    <MenuItem key={roleId} value={roleId}>
                      <Box>
                        <Typography variant="body2">{role.displayName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {role.description || `Role: ${role.name}`}
                        </Typography>
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
              {formErrors.role && <FormHelperText error>{formErrors.role}</FormHelperText>}
              {loadingRoles && <FormHelperText>Loading roles...</FormHelperText>}
              {!loadingRoles && roles.length === 0 && (
                <FormHelperText error>No roles available. Please contact administrator.</FormHelperText>
              )}
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button fullWidth variant="outlined" onClick={onClose} disabled={loading} sx={{ borderRadius: 2, py: 1.5 }} > Cancel </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={ loading || loadingRoles || roles.length === 0 || !formData.firstName || !formData.lastName || !formData.email || !formData.role }
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          sx={{
            borderRadius: 2, py: 1.5,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(25, 118, 210, 0.4)', },
            transition: 'all 0.3s ease',
          }} >
          {loading ? 'Saving...' : isEditing ? 'Update User' : 'Register User'}
        </Button>
      </DialogActions>
      {loading && ( <LinearProgress sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} /> )}
    </Dialog>
  );
};
export default RegisterUserDialog;