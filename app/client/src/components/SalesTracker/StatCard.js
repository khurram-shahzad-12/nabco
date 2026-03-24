import { Box, Card, CardContent, Typography } from "@mui/material";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';

const StatCard = ({ title, value, growth, isCurrency = false, type, StatIcon = PointOfSaleIcon }) => {
    const Icon = growth > 0 ? TrendingUpIcon : TrendingDownIcon;
    const color = growth > 0 ? 'success.main' : 'error.main';

    return (
        <Card sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-5px)' } }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mx: 1 }}>
                    <Typography color="textSecondary" gutterBottom>{title}</Typography>
                    <Box sx={{ bgcolor: 'black', borderRadius: '50%', boxShadow: 1, width: 40, height: 40, display: 'flex', justifyContent: 'center', alignItems: "center" }}><StatIcon sx={{ color: 'yellow', fontSize: 20 }} /></Box>
                </Box>
                <Typography variant="h5" component="div">
                    {isCurrency ? `£ ${value?.toLocaleString()}` : value?.toLocaleString() || 0}
                </Typography>
                <Typography variant="body2" color={color} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Icon sx={{ fontSize: '16px', mr: 0.5 }} />
                    {growth !== undefined ? `${Math.abs(growth).toFixed(1)}% from last ${type === "dashboard" ? "year" : "month"}` : 'no data found'}
                </Typography>
            </CardContent>
        </Card>
    )
}

export default StatCard