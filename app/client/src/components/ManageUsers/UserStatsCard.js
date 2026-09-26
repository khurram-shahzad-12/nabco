import { Grid, Card, CardContent, Box, Typography, Avatar, useTheme, alpha, Stack } from '@mui/material';
import { Group as GroupIcon, CheckCircle as CheckCircleIcon, AdminPanelSettings as AdminPanelSettingsIcon, VpnKey as VpnKeyIcon, TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  cursor: 'default',
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: theme.shadows[8],
    '& .card-icon': { transform: 'scale(1.1) rotate(-5deg)', },
    '& .card-glow': { opacity: 1, },
  },
}));

const GlowEffect = styled(Box)(({ color }) => ({
  position: 'absolute', top: -40, right: -40, width: 120, height: 120,
  borderRadius: '50%',
  background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
  opacity: 0, transition: 'opacity 0.4s ease',
  pointerEvents: 'none',
  '&.active': { opacity: 1, },
}));

const IconWrapper = styled(Avatar)(({ theme, bgcolor, iconcolor }) => ({
  width: 52, height: 52,
  background: bgcolor || theme.palette.primary.light,
  color: iconcolor || theme.palette.primary.main,
  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: `0 4px 12px ${alpha(iconcolor || theme.palette.primary.main, 0.2)}`,
  '& .MuiSvgIcon-root': { fontSize: 26, },
}));

const UserStatsCard = ({ users = [], roles = [], permissions = [] }) => {
  const theme = useTheme();
  const activeUsers = users.filter(u => u.isActive === true).length;
  const inactiveUsers = users.length - activeUsers;
  const totalRoles = roles.length;
  const totalPermissions = permissions.length;
  const stats = [
    {
      id: 1,
      label: 'Total Users',
      value: users.length,
      icon: <GroupIcon />,
      bgColor: alpha(theme.palette.primary.main, 0.1),
      color: theme.palette.primary.main,
      glowColor: alpha(theme.palette.primary.main, 0.15),
      subText: `${activeUsers} active`,
    },
    {
      id: 2,
      label: 'Active Users',
      value: activeUsers,
      icon: <CheckCircleIcon />,
      bgColor: alpha(theme.palette.success.main, 0.1),
      color: theme.palette.success.main,
      glowColor: alpha(theme.palette.success.main, 0.15),
      subText: `${inactiveUsers} inactive`,
      trend: 'up',
    },
    {
      id: 3,
      label: 'Roles',
      value: totalRoles,
      icon: <AdminPanelSettingsIcon />,
      bgColor: alpha(theme.palette.warning.main, 0.1),
      color: theme.palette.warning.main,
      glowColor: alpha(theme.palette.warning.main, 0.15),
      subText: `${totalRoles} configured`,
    },
    {
      id: 4,
      label: 'Permissions',
      value: totalPermissions,
      icon: <VpnKeyIcon />,
      bgColor: alpha(theme.palette.info.main, 0.1),
      color: theme.palette.info.main,
      glowColor: alpha(theme.palette.info.main, 0.15),
      subText: `${totalPermissions} available`,
    },
  ];

 return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {stats.map((stat) => (
        <Grid item xs={12} sm={6} md={3} key={stat.id}>
          <StyledCard>
            <GlowEffect  className="card-glow"  color={stat.glowColor} />
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <IconWrapper className="card-icon" bgcolor={stat.bgColor} iconcolor={stat.color} > {stat.icon} </IconWrapper>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="h4"
                    component="div"
                    fontWeight={700}
                    sx={{ fontSize: '1.75rem', lineHeight: 1.2, color: stat.color, letterSpacing: '-0.5px', }}
                  >
                    {stat.value.toLocaleString()}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={500}
                    sx={{ fontSize: '0.8rem' }}
                  >
                    {stat.label}
                  </Typography>
                  {stat.subText && (
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      sx={{ fontSize: '0.65rem', display: 'block', mt: 0.25, }}
                    >
                      {stat.subText}
                    </Typography>
                  )}
                </Box>
                {stat.trend && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.25,
                      color: stat.trend === 'up'  ? theme.palette.success.main  : theme.palette.error.main,
                      bgcolor: stat.trend === 'up' ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                      px: 0.75, py: 0.25,
                      borderRadius: 1,
                    }}
                  >
                    {stat.trend === 'up' ? ( <TrendingUpIcon sx={{ fontSize: 14 }} /> ) : ( <TrendingDownIcon sx={{ fontSize: 14 }} /> )}
                  </Box>
                )}
              </Stack>
              {stat.id === 1 && (
                <Box
                  sx={{ mt: 1.5, height: 2, borderRadius: 1, background: theme.palette.divider, overflow: 'hidden', }}
                >
                  <Box
                    sx={{
                      width: `${(activeUsers / (users.length || 1)) * 100}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                      borderRadius: 1,
                      transition: 'width 0.8s ease',
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </StyledCard>
        </Grid>
      ))}
    </Grid>
  );
};

export default UserStatsCard;