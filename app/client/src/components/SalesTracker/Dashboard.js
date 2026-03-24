import { Box, Grid, Paper } from '@mui/material';
import { useEffect, useState } from 'react';
import { defaultSnackState, getSalesTrackerData } from '../formFunctions/FormFunctions';
import StatCard from './StatCard';
import CustomisedSnackBar from '../customisedSnackBar/CustomisedSnackBar';
import PieChart from './PieChart';
import BarChart from './BarChart';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const Dashboard = ({ startOfDate, endOfDate, reload, setReload }) => {
  const [snackState, setSnackState] = useState(defaultSnackState);
  const [dashboardData, setDashboardData] = useState(null);

  const fetchDashboardData = async () => {
    getSalesTrackerData({url: `api/salestracker/dashboardData?start_date=${startOfDate}&end_date=${endOfDate}`,setState: setDashboardData, setReload, setSnackState});
  }
  useEffect(() => { fetchDashboardData() }, [startOfDate, endOfDate, reload])
  return (
    <Box >
      <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
      <Grid container spacing={1} >
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title={'Total Sales'} value={dashboardData?.summary?.totalSales} growth={dashboardData?.summary?.salesGrowth} isCurrency type={"dashboard"} StatIcon={PointOfSaleIcon}/>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Orders" value={dashboardData?.summary?.totalOrders} growth={dashboardData?.summary?.ordersGrowth} type={"dashboard"} StatIcon={ShoppingCartIcon}/>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Active Customers" value={dashboardData?.summary?.activeCustomers} growth={dashboardData?.summary?.customerGrowth} type={"dashboard"} StatIcon={AccountBoxIcon}/>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Avg. Order Value" value={dashboardData?.summary?.avgOrderValue} growth={dashboardData?.summary?.averageOrderGrowth} isCurrency type={"dashboard"} StatIcon={CurrencyExchangeIcon}/>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 2, height: 550 }}>
            <Box sx={{ width: "100%", height: "100%" }}>
              <BarChart
                title='Sales Performance'
                labels={dashboardData?.monthlySales?.map(item => item.month) || []}
                data1={dashboardData?.monthlySales?.map(item => item.totalSales) || []}
                data2={dashboardData?.monthlySales?.map(item => item.salesTarget) || []}
                datasetLabel1='Actual Sales'
                datasetLabel2='Sales Target'
              />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2, height: 550 }}>
            <Box sx={{ width: "100%", height: "100%" }}>
              <PieChart
                title='Top Selling Products'
                labels={dashboardData?.topProducts?.map(product => product.productName) || []}
                data={dashboardData?.topProducts?.map(product => product.totalRevenue)}
                legendPosition='top'
                labelsPadding={15}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard