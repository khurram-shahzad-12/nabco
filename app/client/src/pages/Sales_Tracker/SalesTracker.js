import { useState } from 'react';
import Dashboard from '../../components/SalesTracker/Dashboard';
import { Avatar, Button, Box, Container, Paper, Typography, Tabs, Tab } from '@mui/material';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler, } from 'chart.js';
import moment from 'moment';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SalesRepPerformance from '../../components/SalesTracker/SalesRepPerformance';
import ProductPerformance from '../../components/SalesTracker/ProductPerformance';
import OrderReport from '../../components/SalesTracker/OrderReport';
import BusinessReport from '../../components/SalesTracker/BusinessReport';
import DateRangeFilter from '../../components/Common/DateRangFilter';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

const SalesTracker = () => {
  const [value, setValue] = useState(0);
  const [startDate, setStartDate] = useState(moment().subtract(3, 'month').toDate());
  const [endDate, setEndDate] = useState(new Date());
  const [reload, setReload] = useState(false);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleDateChange = (newDate, dateType) => {
    if (dateType === "start") {
      setStartDate(newDate);
    } else {
      setEndDate(newDate);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="xl" sx={{ mb: 4 }}>
        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Dashboard" icon={<AssessmentIcon />} iconPosition="start" />
            <Tab label="Sales Representatives" icon={<Avatar sx={{ width: 20, height: 20 }} />} iconPosition="start" />
            <Tab label="Products" icon={<InventoryIcon />} iconPosition="start" />
            <Tab label="Orders Report" icon={<ShoppingCartIcon />} iconPosition="start" />
            <Tab label="Business Report" icon={<StorefrontIcon />} iconPosition="start" />
          </Tabs>
        </Paper>
        <Box sx={{ display: { xs: 'block', lg: 'flex' }, justifyContent: "space-between", mt: 1, }}>
          <Box>
            <Typography variant="h4" sx={{ mt: 2, color: 'greenyellow', borderBottom: 2 }}>
              {value === 0 ? "Sales Dashboard" : value === 1 ? " Sales Representatives" : value === 2 ? "Products Performance" : value === 3 ? "Orders Report" : value === 4 ? "Business Report" : ""}
            </Typography>
          </Box>
          <Box item xs={12} md={8} sx={{ height: '100px', display: 'flex', alignItems: "center" }}>
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onDateChange={handleDateChange}
            />
            <Button variant="contained" sx={{ ml: 2 }} onClick={() => setReload(true)}>Reload</Button>
          </Box>
        </Box>
        <Box sx={{ py: 1 }}>
          {value === 0 && <Dashboard startOfDate={startDate} endOfDate={endDate} reload={reload} setReload={setReload} />}
          {value === 1 && <SalesRepPerformance startOfDate={startDate} endOfDate={endDate} reload={reload} setReload={setReload} />}
          {value === 2 && <ProductPerformance startOfDate={startDate} endOfDate={endDate} reload={reload} setReload={setReload} />}
          {value === 3 && <OrderReport startOfDate={startDate} endOfDate={endDate} reload={reload} setReload={setReload} />}
          {value === 4 && <BusinessReport startOfDate={startDate} endOfDate={endDate} reload={reload} setReload={setReload} />}
        </Box>
      </Container>
    </Box>
  );
};

export default SalesTracker;