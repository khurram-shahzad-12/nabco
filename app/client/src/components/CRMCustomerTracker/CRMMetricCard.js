import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const CRMMetricCard = ({ title, value, icon: Icon, type }) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', p: 2 }}>
      {Icon && (
        <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
          <Icon sx={{ fontSize: 40, color: 'primary.main' }} />
        </Box>
      )}
      <CardContent sx={{ flex: 1, p: '0 !important' }}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h5" component="div">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default CRMMetricCard;