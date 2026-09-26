import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Tab, Tabs, Grid, Card, CardContent, LinearProgress, Alert, Snackbar, InputAdornment, FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Tooltip } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Search as SearchIcon, PersonAdd as PersonAddIcon, VpnKey as VpnKeyIcon, Security as SecurityIcon, AdminPanelSettings as AdminPanelSettingsIcon, CheckCircle as CheckCircleIcon, Group as GroupIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import RegisterUserDialog from '../../components/ManageUsers/RegisterUserDialog';
import RoleDialog from '../../components/ManageUsers/RoleDialog';
import UserTable from '../../components/ManageUsers/UserTable';
import UserStatsCard from '../../components/ManageUsers/UserStatsCard';
import RolesList from '../../components/ManageUsers/RoleList';
import axiosDefault from '../../components/axiosDefault/axiosDefault';
import { URL_ROOT } from '../../configs/config';
import ManagePermissions from '../../components/ManageUsers/ManagePermissions';
import { defaultSnackState } from '../../components/formFunctions/FormFunctions';
import displaySnackState from '../../components/customisedSnackBar/DisplaySnackState';
import CustomisedSnackBar from '../../components/customisedSnackBar/CustomisedSnackBar';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
  },
}));

const ManageUsers = () => {
  const axios = axiosDefault();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [snackState, setSnackState] = useState(defaultSnackState);
  const [expandedUser, setExpandedUser] = useState(null);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [openRegisterDialog, setOpenRegisterDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [userForm, setUserForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: '', status: 'active', });

  const fetchPermissions = async () => {
    setLoadingPermissions(true);
    try {
      const response = await axios.get(`${URL_ROOT}/api/permissions`);
      if (response.data.success) { setPermissions(response.data.data); }
    } catch (error) {
      displaySnackState(`Failed to load permissions`, "error", setSnackState); 
    } finally { setLoadingPermissions(false); }
  };

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const response = await axios.get(`${URL_ROOT}/api/roles`);
      if (response.data.success) { setRoles(response.data.data); }
    } catch (error) {
      displaySnackState(`Failed to load roles`, "error", setSnackState);
    } finally { setLoadingRoles(false); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${URL_ROOT}/api/user`);
      if (response.data.success) {
        setUsers(response.data.users);
        setFilteredUsers(response.data.users);
      }
    } catch (error) {
      displaySnackState(`Failed to load users`, "error", setSnackState);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchRoles();
    fetchUsers();
    fetchPermissions();
  }, []);

  useEffect(() => {
    let filtered = users;
    if (searchTerm) {
      filtered = filtered.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredUsers(filtered);
    setPage(0);
  }, [users, searchTerm]);

  const handleSearchChange = (event) => { setSearchTerm(event.target.value); };
  const handleTabChange = (event, newValue) => { setSelectedTab(newValue); };
  const handlePageChange = (event, newPage) => { setPage(newPage); };
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const handleExpandUser = (userId) => { setExpandedUser(expandedUser === userId ? null : userId); };
  const handleOpenRegisterDialog = (user = null) => {
    setSelectedUserForEdit(user);
    setOpenRegisterDialog(true);
  };
  const handleCloseRegisterDialog = () => {
    setOpenRegisterDialog(false);
    setSelectedUserForEdit(null);
  };

  const handleRegisterSuccess = (message) => {
    displaySnackState(message, "success", setSnackState);
    fetchUsers();
  };

  const handleRegisterError = (errorMessage) => {
    displaySnackState(errorMessage, "error", setSnackState);
  };

  const refreshUserList = () => {
    fetchUsers();
    fetchRoles();
    fetchPermissions();
  };

  const handleDeleteUser = async (userId) => {
    setLoading(true);
    try {
      const response = await axios.delete(`${URL_ROOT}/api/user/${userId}`);
      if (response.data.success) {
        setUsers(users.filter(u => (u._id) !== userId));
        displaySnackState(`User deleted successfully`, "success", setSnackState)
      }
    } catch (error) {
      displaySnackState(`failed to delete User`, "success", setSnackState)
    } finally { setLoading(false); }
  };

  const handleToggleUserStatus = async (userId, newStatus) => {
    setLoading(true);
    try {
      const response = await axios.patch(`${URL_ROOT}/api/user/${userId}/status`, { isActive: newStatus });
      if (response.data.success) {
        setUsers(users.map(u => {
          const id = u._id;
          return id === userId ? { ...u, isActive: newStatus } : u;
        }));
      }
    } catch (error) {
      displaySnackState(error.response?.data || `Failed toggle user status`, "error", setSnackState)
    } finally { setLoading(false); }
  };

  const handleOpenRoleDialog = (role = null) => {
    setEditingRole(role);
    setOpenRoleDialog(true);
  };

  const handleCloseRoleDialog = () => {
    setOpenRoleDialog(false);
    setEditingRole(null);
  };

  const handleRoleSuccess = async (formData) => {
    setLoading(true);
    try {
      let response;
      if (editingRole) {
        response = await axios.put(`${URL_ROOT}/api/roles/${editingRole._id}`, {
          displayName: formData.displayName,
          description: formData.description,
          permissions: formData.permissions,
        });
      } else {
        response = await axios.post(`${URL_ROOT}/api/roles`, {
          name: formData.name,
          displayName: formData.displayName,
          description: formData.description,
          permissions: formData.permissions,
        });
      }
      if (response.data.success) {
        displaySnackState(editingRole ? 'Role updated successfully!' : 'Role created successfully!', "success", setSnackState);
        fetchRoles(); 
        handleCloseRoleDialog();
      }
    } catch (error) {
       displaySnackState('Failed to save role', "error", setSnackState);
    } finally { setLoading(false); }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role? This will remove it from all users.')) {
      return;
    }
    setLoading(true);
    try {
      const response = await axios.delete(`${URL_ROOT}/api/roles/${roleId}`);
      if (response.data.success) {
        displaySnackState('Role Deleted Successfully', "success", setSnackState);
        fetchRoles();
      }
    } catch (error) {
      displaySnackState('Failed to deleted role', "error", setSnackState);
    } finally { setLoading(false); }
  };

  const handlePermissionCreated = (newPermission) => { setPermissions(prev => [...prev, newPermission]); };

  const handlePermissionUpdated = (updatedPermission) => {
    setPermissions(prev => prev.map(p => 
      (p.id || p._id) === (updatedPermission.id || updatedPermission._id) 
        ? updatedPermission 
        : p
    ));
  };

  const handlePermissionDeleted = (permissionId) => {
    setPermissions(prev => prev.filter(p => (p.id || p._id) !== permissionId));
  };

  const renderUserTable = () => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    return (
      <UserTable
        users={paginatedUsers}
        totalUsers={filteredUsers.length}
        roles={roles}
        onEdit={handleOpenRegisterDialog}
        onDelete={handleDeleteUser}
        onToggleStatus={handleToggleUserStatus}
        onExpand={handleExpandUser}
        expandedUser={expandedUser}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        loading={loading}
      />
    );
  };
  const renderStats = () => {
    return (
      <UserStatsCard
        users={users}
        roles={roles}
        permissions={permissions}
      />
    );
  };
  const renderRoles = () => {
   return (
    <RolesList
      roles={roles}
      onEdit={handleOpenRoleDialog}
      onDelete={handleDeleteRole}
      onCreate={() => handleOpenRoleDialog()}
      loading={loading}
    />
  );
  };
  const renderPermissions = () => {
    return (
      <ManagePermissions
        permissions={permissions}
        loading={loadingPermissions}
        onRefresh={fetchPermissions}
        onPermissionCreated={handlePermissionCreated}
        onPermissionUpdated={handlePermissionUpdated}
        onPermissionDeleted={handlePermissionDeleted}
        apiClient={axios}
        urlRoot={URL_ROOT}
      />
    );
  };
  return (
    <Box sx={{ p: 3, maxWidth: '100%' }}>
      <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage users, roles, and permissions across your organization
        </Typography>
      </Box>
      {renderStats()}
      {selectedTab === 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <TextField
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearchChange}
            size="small"
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: ( <InputAdornment position="start"> <SearchIcon /> </InputAdornment> ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => handleOpenRegisterDialog()}
          >
            Add User
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refreshUserList} > Refresh </Button>
        </Box>
      )}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label={`Users (${users.length})`} />
          <Tab label={`Roles (${roles.length})`} />
          <Tab label={`Permissions (${permissions.length})`} />
        </Tabs>
      </Box>
      <Box sx={{ mt: 2 }}>
        {selectedTab === 0 && renderUserTable()}
        {selectedTab === 1 && renderRoles()}
        {selectedTab === 2 && renderPermissions()}
      </Box>
      {loading && (
        <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }} />
      )}
      <Dialog
        open={openUserDialog}
        onClose={() => setOpenUserDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 2 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            {editingUser ? 'Edit User' : 'Create New User'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {editingUser ? 'Update user information' : 'Add a new user to the system'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={userForm.firstName}
                onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={userForm.lastName}
                onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                required={!editingUser}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  label="Role"
                  required
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id || role._id} value={role.name}>
                      {role.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={userForm.status}
                  onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="locked">Locked</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenUserDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setOpenUserDialog(false);
            }}
          >
            {editingUser ? 'Update User' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
      <RoleDialog
        open={openRoleDialog}
        onClose={handleCloseRoleDialog}
        onSuccess={handleRoleSuccess}
        role={editingRole}
        permissions={permissions}
        loadingPermissions={loadingPermissions}
      />
      <RegisterUserDialog
        open={openRegisterDialog}
        onClose={handleCloseRegisterDialog}
        onSuccess={handleRegisterSuccess}
        onError={handleRegisterError} 
        user={selectedUserForEdit}
        roles={roles}
        loadingRoles={loadingRoles}
      />
    </Box>
  );
};

export default ManageUsers;