import { Grid, Box, Typography, Button, Card, CardContent, Chip, IconButton, Tooltip } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Group as GroupIcon, Security as SecurityIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
  },
}));

const RolesList = ({ roles = [], onEdit, onDelete, onCreate, loading = false }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">Roles & Permissions</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate} disabled={loading} > Create Role </Button>
        </Box>
      </Grid>
      {roles.map((role) => (
        <Grid item xs={12} md={6} lg={4} key={role.id || role._id}>
          <StyledCard>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h6" fontWeight={600}> {role.displayName} </Typography>
                  <Typography variant="caption" color="text.secondary"> {role.name} </Typography>
                </Box>
                <Box>
                  <Tooltip title="Edit Role">
                    <IconButton size="small" onClick={() => onEdit(role)} disabled={loading} > <EditIcon fontSize="small" /> </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Role">
                    <IconButton 
                      size="small" 
                      onClick={() => onDelete(role.id || role._id)} 
                      color="error"
                      disabled={loading}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}> {role.description} </Typography>
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  icon={<GroupIcon />}
                  label={`${role.userCount || 0} Users`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<SecurityIcon />}
                  label={`${(role.permissions || []).length} Permissions`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
      ))}
    </Grid>
  );
};

export default RolesList;