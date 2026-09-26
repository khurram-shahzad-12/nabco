// import React, { useState, useEffect } from 'react';
// import {
//   Box,
//   Container,
//   Typography,
//   TextField,
//   Button,
//   Paper,
//   Avatar,
//   CircularProgress,
//   Alert,
//   InputAdornment,
//   IconButton,
//   Link,
//   useTheme,
//   Grid,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   FormHelperText,
//   Stack,
//   Chip,
//   Fade
// } from '@mui/material';
// import {
//   PersonAdd,
//   Email,
//   Lock,
//   Person,
//   Phone,
//   Visibility,
//   VisibilityOff,
//   AssignmentInd,
//   CheckCircle as CheckCircleIcon
// } from '@mui/icons-material';
// import { useAuth } from '../../contexts/AuthContext';
// import { useNavigate, Link as RouterLink } from 'react-router-dom';
// import axiosDefault from '../../components/axiosDefault/axiosDefault';
// import { URL_ROOT } from '../../configs/config';

// const Register = () => {
//   const axios = axiosDefault();
//   const theme = useTheme();
//   const navigate = useNavigate();
//   const { isAuthenticated, isLoading, error } = useAuth();
  
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [localError, setLocalError] = useState('');
//   const [roles, setRoles] = useState([]);
//   const [loadingRoles, setLoadingRoles] = useState(true);
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     email: '',
//     password: '',
//     confirmPassword: '',
//     phone: '',
//     position: '',
//     role: ''
//   });
//   const [formErrors, setFormErrors] = useState({});

//   // Fetch roles on component mount
//   useEffect(() => {
//     const fetchRoles = async () => {
//       try {
//         const response = await axios.get(`${URL_ROOT}/api/roles`);
//         if (response.data.success) {
//           setRoles(response.data.data);
//           // Set default role to 'sales_rep' if available
//           const defaultRole = response.data.data.find(r => r.name === 'sales_rep');
//           if (defaultRole) {
//             setFormData(prev => ({ ...prev, role: defaultRole.name }));
//           } else if (response.data.data.length > 0) {
//             setFormData(prev => ({ ...prev, role: response.data.data[0].name }));
//           }
//         }
//       } catch (error) {
//         console.error('Error fetching roles:', error);
//         setLocalError('Failed to load roles. Please refresh the page.');
//       } finally {
//         setLoadingRoles(false);
//       }
//     };

//     fetchRoles();
//   }, []);

//   // Redirect if already authenticated
//   useEffect(() => {
//     if (isAuthenticated) {
//       navigate('/');
//     }
//   }, [isAuthenticated, navigate]);

//   const handleChange = (field) => (event) => {
//     setFormData({
//       ...formData,
//       [field]: event.target.value,
//     });
//     if (formErrors[field]) {
//       setFormErrors({
//         ...formErrors,
//         [field]: '',
//       });
//     }
//     setLocalError('');
//   };

//   const handleTogglePassword = () => { setShowPassword(!showPassword); };
//   const handleToggleConfirmPassword = () => { setShowConfirmPassword(!showConfirmPassword); };

//   const validateForm = () => {
//     const errors = {};
//     let isValid = true;

//     if (!formData.firstName.trim()) {
//       errors.firstName = 'First name is required';
//       isValid = false;
//     }
//     if (!formData.lastName.trim()) {
//       errors.lastName = 'Last name is required';
//       isValid = false;
//     }
//     if (!formData.email.trim()) {
//       errors.email = 'Email is required';
//       isValid = false;
//     } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
//       errors.email = 'Please enter a valid email address';
//       isValid = false;
//     }
//     if (!formData.password) {
//       errors.password = 'Password is required';
//       isValid = false;
//     } else if (formData.password.length < 8) {
//       errors.password = 'Password must be at least 8 characters';
//       isValid = false;
//     }
//     if (formData.password !== formData.confirmPassword) {
//       errors.confirmPassword = 'Passwords do not match';
//       isValid = false;
//     }
//     if (!formData.role) {
//       errors.role = 'Please select a role';
//       isValid = false;
//     }

//     setFormErrors(errors);
//     return isValid;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!validateForm()) return;
    
//     setLoading(true);
//     setLocalError('');

//     try {
//       const userData = {
//         firstName: formData.firstName,
//         lastName: formData.lastName,
//         email: formData.email,
//         password: formData.password,
//         phone: formData.phone,
//         position: formData.position,
//         role: formData.role,
//       };

//       const response = await axios.post(`${URL_ROOT}/api/user/register`, userData);
      
//       if (response.data.success) {
//         // Registration successful
//         navigate('/');
//       } else {
//         // Handle error response
//         const errorMsg = response.data.message || 'Registration failed. Please try again.';
//         setLocalError(errorMsg);
//       }
//     } catch (error) {
//       console.error('Registration error:', error);
//       let errorMsg;
//       if (error.response) {
//         errorMsg = error.response.data?.message || 'Registration failed. Please try again.';
//       } else if (error.request) {
//         errorMsg = 'Network error. Please check your connection.';
//       } else {
//         errorMsg = 'Registration failed. Please try again.';
//       }
//       setLocalError(errorMsg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Box
//       sx={{
//         minHeight: '100vh',
//         display: 'flex',
//         alignItems: 'center',
//         background: theme.palette.mode === 'dark' 
//           ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
//           : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//         py: 4
//       }}
//     >
//       <Container maxWidth="sm">
//         <Paper
//           elevation={24}
//           sx={{
//             p: 4,
//             borderRadius: 4,
//             background: theme.palette.mode === 'dark' 
//               ? 'rgba(30, 30, 50, 0.95)' 
//               : 'rgba(255, 255, 255, 0.95)',
//             backdropFilter: 'blur(20px)',
//             border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)'}`
//           }}
//         >
//           <Box sx={{ textAlign: 'center', mb: 4 }}>
//             <Avatar
//               sx={{
//                 width: 80,
//                 height: 80,
//                 mx: 'auto',
//                 mb: 2,
//                 bgcolor: 'secondary.main',
//                 boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
//               }}
//             >
//               <PersonAdd fontSize="large" />
//             </Avatar>
//             <Typography 
//               variant="h4" 
//               component="h1" 
//               fontWeight="700"
//               sx={{ 
//                 background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//                 WebkitBackgroundClip: 'text',
//                 WebkitTextFillColor: 'transparent'
//               }}
//             >
//               Create Account
//             </Typography>
//             <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
//               Join us and start your journey
//             </Typography>
//           </Box>

//           {(localError || error) && (
//             <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
//               {localError || error}
//             </Alert>
//           )}

//           <form onSubmit={handleSubmit}>
//             <Grid container spacing={2}>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   label="First Name"
//                   value={formData.firstName}
//                   onChange={handleChange('firstName')}
//                   error={!!formErrors.firstName}
//                   helperText={formErrors.firstName}
//                   required
//                   size="small"
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <Person sx={{ color: "action.active", fontSize: 18 }} />
//                       </InputAdornment>
//                     )
//                   }}
//                 />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   label="Last Name"
//                   value={formData.lastName}
//                   onChange={handleChange('lastName')}
//                   error={!!formErrors.lastName}
//                   helperText={formErrors.lastName}
//                   required
//                   size="small"
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <Person sx={{ color: "action.active", fontSize: 18 }} />
//                       </InputAdornment>
//                     )
//                   }}
//                 />
//               </Grid>
//               <Grid item xs={12}>
//                 <TextField
//                   fullWidth
//                   label="Email Address"
//                   type="email"
//                   value={formData.email}
//                   onChange={handleChange('email')}
//                   error={!!formErrors.email}
//                   helperText={formErrors.email}
//                   required
//                   size="small"
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <Email sx={{ color: "action.active", fontSize: 18 }} />
//                       </InputAdornment>
//                     )
//                   }}
//                 />
//               </Grid>
//               <Grid item xs={12}>
//                 <TextField
//                   fullWidth
//                   label="Phone Number"
//                   value={formData.phone}
//                   onChange={handleChange('phone')}
//                   size="small"
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <Phone sx={{ color: "action.active", fontSize: 18 }} />
//                       </InputAdornment>
//                     )
//                   }}
//                 />
//               </Grid>
//               <Grid item xs={12}>
//                 <TextField
//                   fullWidth
//                   label="Password"
//                   type={showPassword ? 'text' : 'password'}
//                   value={formData.password}
//                   onChange={handleChange('password')}
//                   error={!!formErrors.password}
//                   helperText={formErrors.password || 'Minimum 8 characters'}
//                   required
//                   size="small"
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <Lock sx={{ color: "action.active", fontSize: 18 }} />
//                       </InputAdornment>
//                     ),
//                     endAdornment: (
//                       <InputAdornment position="end">
//                         <IconButton onClick={handleTogglePassword} size="small">
//                           {showPassword ? <VisibilityOff /> : <Visibility />}
//                         </IconButton>
//                       </InputAdornment>
//                     )
//                   }}
//                 />
//                 {formData.password && (
//                   <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
//                     <Chip
//                       label="8+ characters"
//                       size="small"
//                       color={formData.password.length >= 8 ? 'success' : 'default'}
//                       variant={formData.password.length >= 8 ? 'filled' : 'outlined'}
//                     />
//                     <Chip
//                       label="Contains letters"
//                       size="small"
//                       color={/[a-zA-Z]/.test(formData.password) ? 'success' : 'default'}
//                       variant={/[a-zA-Z]/.test(formData.password) ? 'filled' : 'outlined'}
//                     />
//                     <Chip
//                       label="Contains numbers"
//                       size="small"
//                       color={/[0-9]/.test(formData.password) ? 'success' : 'default'}
//                       variant={/[0-9]/.test(formData.password) ? 'filled' : 'outlined'}
//                     />
//                   </Stack>
//                 )}
//               </Grid>
//               <Grid item xs={12}>
//                 <TextField
//                   fullWidth
//                   label="Confirm Password"
//                   type={showConfirmPassword ? 'text' : 'password'}
//                   value={formData.confirmPassword}
//                   onChange={handleChange('confirmPassword')}
//                   error={!!formErrors.confirmPassword}
//                   helperText={formErrors.confirmPassword}
//                   required
//                   size="small"
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <Lock sx={{ color: "action.active", fontSize: 18 }} />
//                       </InputAdornment>
//                     ),
//                     endAdornment: (
//                       <InputAdornment position="end">
//                         <IconButton onClick={handleToggleConfirmPassword} size="small">
//                           {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
//                         </IconButton>
//                       </InputAdornment>
//                     )
//                   }}
//                 />
//                 {formData.confirmPassword && formData.password === formData.confirmPassword && (
//                   <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                     <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
//                     <Typography variant="caption" color="success.main" fontWeight={500}>
//                       Passwords match
//                     </Typography>
//                   </Box>
//                 )}
//               </Grid>
//               <Grid item xs={12}>
//                 <TextField
//                   fullWidth
//                   label="Position (Optional)"
//                   value={formData.position}
//                   onChange={handleChange('position')}
//                   size="small"
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <AssignmentInd sx={{ color: "action.active", fontSize: 18 }} />
//                       </InputAdornment>
//                     )
//                   }}
//                 />
//               </Grid>
//               <Grid item xs={12}>
//                 <FormControl fullWidth required error={!!formErrors.role}>
//                   <InputLabel>Role</InputLabel>
//                   <Select
//                     value={formData.role}
//                     onChange={handleChange('role')}
//                     label="Role"
//                     disabled={loadingRoles}
//                     size="small"
//                     startAdornment={
//                       <InputAdornment position="start">
//                         <AssignmentInd sx={{ color: "action.active", fontSize: 18 }} />
//                       </InputAdornment>
//                     }
//                   >
//                     {roles.map((role) => {
//                       const roleId = role._id || role.id;
//                       return (
//                         <MenuItem key={roleId} value={role.name}>
//                           <Box>
//                             <Typography variant="body2">{role.displayName}</Typography>
//                             <Typography variant="caption" color="text.secondary">
//                               {role.description || `Role: ${role.name}`}
//                             </Typography>
//                           </Box>
//                         </MenuItem>
//                       );
//                     })}
//                   </Select>
//                   {formErrors.role && <FormHelperText error>{formErrors.role}</FormHelperText>}
//                   {loadingRoles && <FormHelperText>Loading roles...</FormHelperText>}
//                   {!loadingRoles && roles.length === 0 && (
//                     <FormHelperText error>No roles available. Please contact administrator.</FormHelperText>
//                   )}
//                 </FormControl>
//               </Grid>
//             </Grid>

//             <Button
//               type="submit"
//               fullWidth
//               variant="contained"
//               size="large"
//               disabled={loading || loadingRoles || roles.length === 0 || !formData.firstName || !formData.lastName || !formData.email || !formData.role}
//               startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PersonAdd />}
//               sx={{
//                 mt: 3,
//                 py: 1.5,
//                 borderRadius: 2,
//                 background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
//                 '&:hover': {
//                   transform: 'translateY(-2px)',
//                   boxShadow: '0 8px 25px rgba(25, 118, 210, 0.4)'
//                 },
//                 transition: 'all 0.3s ease'
//               }}
//             >
//               {loading ? 'Creating Account...' : 'Create Account'}
//             </Button>
//           </form>
//         </Paper>
//       </Container>
//     </Box>
//   );
// };

// export default Register;