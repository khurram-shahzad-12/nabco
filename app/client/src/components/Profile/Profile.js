import { useAuth } from '../../contexts/AuthContext';
import { Box, Typography, Avatar, Skeleton } from "@mui/material";

const Profile = props => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="80%" height={24} />
          <Skeleton variant="text" width="60%" height={16} />
        </Box>
      </Box>
    );
  }
  if (!isAuthenticated) {
    return null;
  }
  const displayName = user?.user_name || user?.email || 'User';
  const email = user?.email || ''; 
  const getAvatarColor = () => {
    const colors = ['#1976d2', '#dc004e', '#2e7d32', '#ed6c02', '#9c27b0', '#0288d1', '#d32f2f', '#7b1fa2'];
    const index = (email?.length || 0) % colors.length;
    return colors[index];
  };
  return (
    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid', borderColor: 'divider', mb: 1 }}>
      <Avatar  sx={{ bgcolor: getAvatarColor(), width: 40, height: 40, fontSize: '1rem', fontWeight: 600 }} >
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap fontWeight={600}>
          {displayName}
        </Typography>
        <Typography variant="caption" noWrap color="text.secondary">
          {email || 'No email'}
        </Typography>
      </Box>
    </Box>
  );
};

export default Profile;