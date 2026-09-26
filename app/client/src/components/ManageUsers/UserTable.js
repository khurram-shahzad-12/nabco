import React from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Avatar, Box, Typography, Chip, IconButton, Tooltip, Grid, useTheme } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, LockReset as LockResetIcon, CheckCircle as CheckCircleIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  overflow: 'hidden',
  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa',
  minHeight: 400,
  '& .MuiTable-root': {
    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa',
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
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : theme.palette.primary.main,
  '& .MuiTableCell-head': { color: '#ffffff', fontWeight: 600, fontSize: '0.875rem', letterSpacing: '0.5px', borderBottom: 'none', },
}));

const StyledPaper = styled(Paper)({
  borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', backgroundColor: 'transparent',
});

const paginationStyles = (theme) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa',
  color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#333333',
  borderTop: theme.palette.mode === 'dark' ? '1px solid #333333' : '1px solid #e0e0e0',
  '& .MuiTablePagination-select, & .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows, & .MuiIconButton-root, & .MuiSelect-icon': {
    color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#333333',
  },
  '& .MuiMenuItem-root': {
    backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#ffffff',
    color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#333333',
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#f0f0f0',
    },
    '&.Mui-selected': {
      backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e8eaed',
      '&:hover': {
        backgroundColor: theme.palette.mode === 'dark' ? '#4a4a4a' : '#d5d8dd',
      },
    },
  },
});

const StatusChip = ({ status }) => {
  const isActive = status === true;
  return (
    <Chip
      label={isActive ? 'ACTIVE' : 'INACTIVE'}
      size="small"
      sx={{
        fontWeight: 600, backgroundColor: isActive ? '#e8f5e9' : '#ffebee', color: isActive ? '#2e7d32' : '#c62828',
      }}
    />
  );
};

const UserTable = ({
  users,
  totalUsers = 0,
  roles = [],
  onEdit,
  onDelete,
  onToggleStatus,
  onExpand,
  expandedUser,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  loading,
}) => {
  const theme = useTheme();
  const getRoleDisplayName = (role) => {
    if (!role) return 'No Role';
    if (role.displayName) return role.displayName;
    if (role.name) return role.name;
    return 'Unknown Role';
  };

  const getAvatarColor = (email) => {
    const colors = ['#1976d2', '#dc004e', '#2e7d32', '#ed6c02', '#9c27b0', '#0288d1', '#d32f2f', '#7b1fa2'];
    return colors[(email?.length || 0) % colors.length];
  };

  const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

const formatDate = (date) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch { return ''; }
};

  const formatTime = (date) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleTimeString();
    } catch {
      return '';
    }
  };
  return (
    <StyledPaper>
      <StyledTableContainer component={Paper}>
        <Table>
          <StyledTableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </StyledTableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Loading users...</Typography>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No users found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const userId = user._id;
                const isExpanded = expandedUser === userId;
                return (
                  <React.Fragment key={userId}>
                    <TableRow hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: getAvatarColor(user.email),
                              width: 40,
                              height: 40,
                              fontSize: '1rem',
                            }}
                          >
                            {getInitials(user.firstName, user.lastName)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {user.user_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {userId}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleDisplayName(user.role)}
                          size="small"
                          sx={{
                            backgroundColor: user.role?.name === 'admin'
                              ? (theme.palette.mode === 'dark' ? '#1a237e' : '#e3f2fd')
                              : (theme.palette.mode === 'dark' ? '#2d2d2d' : '#f5f5f5'),
                            color: user.role?.name === 'admin'
                              ? (theme.palette.mode === 'dark' ? '#90caf9' : '#1976d2')
                              : (theme.palette.mode === 'dark' ? '#e0e0e0' : '#616161'),
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusChip status={user.isActive} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(user.lastLogin || user.lastSeen || user.createdAt)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(user.lastLogin || user.lastSeen || user.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Tooltip title="Edit User">
                            <IconButton
                              size="small"
                              onClick={() => onEdit(user)}
                              sx={{ color: theme.palette.primary.main }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {onToggleStatus && (
                            <Tooltip title={user.isActive ? 'Deactivate User' : 'Activate User'}>
                              <IconButton
                                size="small"
                                onClick={() => onToggleStatus(userId, !user.isActive)}
                                sx={{ color: user.isActive ? '#e65100' : '#2e7d32' }}
                              >
                                {user.isActive ? <LockResetIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete User">
                            <IconButton
                              size="small"
                              onClick={() => onDelete(userId)}
                              sx={{ color: theme.palette.error.main }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="More Details">
                            <IconButton size="small" onClick={() => onExpand(userId)}>
                              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={6} sx={{
                          py: 2,
                          backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
                        }}>
                          <Box sx={{ p: 2 }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                              User Details
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={4}>
                                <Typography variant="caption" color="text.secondary">Full Name</Typography>
                                <Typography variant="body2">{user.firstName} {user.lastName}</Typography>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Typography variant="caption" color="text.secondary">Email</Typography>
                                <Typography variant="body2">{user.email}</Typography>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Typography variant="caption" color="text.secondary">Phone</Typography>
                                <Typography variant="body2">{user.phone || 'N/A'}</Typography>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Typography variant="caption" color="text.secondary">Role</Typography>
                                <Typography variant="body2">{getRoleDisplayName(user.role)}</Typography>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Typography variant="caption" color="text.secondary">Position</Typography>
                                <Typography variant="body2">{user.position || 'N/A'}</Typography>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Typography variant="caption" color="text.secondary">Status</Typography>
                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Typography variant="caption" color="text.secondary">Member Since</Typography>
                                <Typography variant="body2">{formatDate(user.createdAt)}</Typography>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Typography variant="caption" color="text.secondary">Last Login</Typography>
                                <Typography variant="body2">{formatDate(user.lastLogin || user.lastSeen) || 'Never'}</Typography>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Typography variant="caption" color="text.secondary">Online Status</Typography>
                                <Typography variant="body2">
                                  {user.online ? (
                                    <Chip label="Online" size="small" color="success" sx={{ fontWeight: 500 }} />
                                  ) : (
                                    'Offline'
                                  )}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          sx={paginationStyles(theme)}
        />
      </StyledTableContainer>
    </StyledPaper>
  );
};
export default UserTable;