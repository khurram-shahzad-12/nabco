import { useState } from "react";
import { Box, Grid, Typography, Card, CardContent, Avatar, Paper, Button } from "@mui/material";
import { defaultSnackState, fetchAllEntriesAndSetRowData, getSalesTrackerData } from "../formFunctions/FormFunctions";
import PieChart from "./PieChart"
import StatCard from "./StatCard";
import BarChart from "./BarChart";
import ExpandableTable from "./ExpandableTable";
import CustomisedSnackBar from "../customisedSnackBar/CustomisedSnackBar";
import { useEffect } from "react";
import ExpandableContent from "./ExpandableContent";
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const SalesRepPerformance = ({ startOfDate, endOfDate, reload, setReload }) => {
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [salesRepData, setSalesRepData] = useState(null);
    const [selectedRep, setSelectedRep] = useState(salesRepData?.[0]?.rep || "");
    const [customerRepData, setCustomerRepData] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCustomerData, setSelectedCustomerData] = useState(null);
    const [sendingData, setSendingData] = useState(false);
    const [salesRep, setSalesRep] = useState([]);

    const fetchAllCustomerSalesRep = () => {
        fetchAllEntriesAndSetRowData('/customerSalesRep', null, setSendingData, setSalesRep, setSnackState);
    };

    const fetchSalesRepData = () => {
        getSalesTrackerData({
            url: `api/salestracker/salesRepData?start_date=${startOfDate}&end_date=${endOfDate}`, setState: setSalesRepData,
            setReload, setIsOpen, setSnackState,
            onSuccess: (data) => {
                if (!selectedRep && data?.length > 0) {
                    setSelectedRep(data[0].rep);
                }
            }
        })
    };

    const getCustomerRepData = () => {
        getSalesTrackerData({
            url: `api/salestracker/customerRepData?start_date=${startOfDate}&end_date=${endOfDate}`,
            setState: setCustomerRepData, setReload, setSnackState,
            onSuccess: (data) => {
                setSelectedCustomerData(
                    data?.find(item => item.rep === selectedRep)?.customers || []
                );
            }
        });
    }
    const selectedData = salesRepData?.find(ele => ele.rep === selectedRep);

    useEffect(() => { if (isOpen) { getCustomerRepData() } }, [isOpen])
    const topOrderingCusotmers = customerRepData?.find(data => data?.rep === selectedRep)?.customers || [];
    const topProductsData = salesRepData?.find(sale => sale.rep === selectedRep)?.topProducts || []
    useEffect(() => {
        fetchSalesRepData();
    }, [startOfDate, endOfDate, reload]);
    useEffect(() => { fetchAllCustomerSalesRep() }, []);
    return (
        <Box>
            <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
            <Grid container spacing={3}>
                <Grid item xs={12} md={3} sx={{ position: "sticky", top: 20 }}>
                    <Box sx={{ position: "sticky", top: 20 }}>
                        <Typography variant="h6" gutterBottom>
                            Sales Team
                        </Typography>
                        <Grid container spacing={2}>
                            {salesRepData?.map(item => (
                                <Grid item xs={12} key={item.rep}>
                                    <Card sx={{ transition: 'all 0.3s', cursor: 'pointer', border: selectedRep === item.rep ? '2px solid #3f51b5' : '', '&:hover': { boxShadow: '0 8px 16px rgba(0,0,0,0.2)' } }}
                                        onClick={() => { setSelectedRep(item.rep); setSelectedCustomerData(customerRepData?.find(data => data?.rep === item.rep)?.customers || []) }}
                                    >
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 40, height: 40 }}>
                                                    {salesRep?.find(s => s._id === item?.rep)?.name?.slice(0, 2).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="h6">{salesRep?.find(s => s._id === item?.rep)?.name || "UnDefined"}</Typography>
                                                    <Typography variant="body2" color="textSecondary">
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid></Box>
                </Grid>
                <Grid item xs={12} md={9}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="h6" gutterBottom>Performance Details: {selectedRep?.name}</Typography>
                        <Button variant="contained" onClick={() => setIsOpen(true)}>Ordering Performance</Button>
                    </Box>
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard title="Total Sales" value={selectedData?.totalSales} growth={selectedData?.salesGrowth} isCurrency StatIcon={PointOfSaleIcon} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard title="Total Orders" value={selectedData?.totalOrders} growth={selectedData?.ordersGrowth} StatIcon={ShoppingCartIcon} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard title="Active Customers" value={selectedData?.activeCustomers} growth={selectedData?.customerGrowth} StatIcon={AccountBoxIcon} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard title="Avg Order Value" value={selectedData?.avgOrderValue} growth={selectedData?.averageOrderGrowth} isCurrency StatIcon={CurrencyExchangeIcon} />
                        </Grid>
                    </Grid>
                    <Paper sx={{ mb: 2, display: isOpen ? 'none' : "block" }}>
                        <Box sx={{ width: '100%', height: '100%', bgcolor: "white" }}>
                            <BarChart
                                title='Monthly Performance (Sales & Target)'
                                labels={salesRepData?.find(sale => sale.rep === selectedRep)?.monthlyData?.map(m => m.month) || []}
                                data1={salesRepData?.find(sale => sale.rep === selectedRep)?.monthlyData?.map(t => t.totalSales) || []}
                                data2={salesRepData?.find(sale => sale.rep === selectedRep)?.monthlyData?.map(st => st.salesTarget) || []}
                                datasetLabel1='Actual Sales'
                                datasetLabel2='Sales Target'
                            />
                        </Box>
                    </Paper>
                    <Paper sx={{ p: 2, height: 500, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', height: '100%', maxWidth: '800px', position: 'relative' }}>
                            <PieChart
                                title={isOpen ? 'Top Ten Ordering Customers' : 'Top Ten Selling Products'}
                                labels={isOpen ? topOrderingCusotmers?.slice(0, 10)?.map(c => c.customerName) : topProductsData?.map(p => p.name) || []}
                                data={isOpen ? topOrderingCusotmers?.slice(0, 10).map(c => c.totalSales) : topProductsData?.map(p => p.totalRevenue) || []}
                            />
                        </Box>
                    </Paper>
                    <Box mt={4} sx={{ display: isOpen ? 'none' : "block" }}>
                        <Paper elevation={3} sx={{ p: 2 }}>
                            <Typography variant="h5" sx={{ textAlign: "center", mb: 2, fontWeight: "bold", color: "primary.main" }}
                            >
                                Top Selling Products Per Month Data
                            </Typography>
                            <ExpandableTable
                                data={salesRepData?.find((data) => data.rep === selectedRep)?.topProducts || []}
                                keyProp="name"
                                columns={[
                                    { header: "Product Name", field: "name" }
                                ]}
                                expandableColumns={[
                                    { header: "Month", field: "month" },
                                    { header: "Total Sold", field: "totalSold" },
                                    {
                                        header: "Total Revenue (£)", field: "totalRevenue",
                                        render: (data) => `£ ${data.totalRevenue.toLocaleString()}`
                                    }
                                ]}
                            />
                        </Paper>
                    </Box>
                    <Paper sx={{ my: 2, display: isOpen ? 'block' : 'none' }}>
                        <ExpandableTable keyProp={"customerId"}
                            data={selectedCustomerData}
                            columns={[
                                { header: "Customer", field: "customerName" },
                                { header: "Ord Count", field: "ordersCount" },
                                { header: "Avg Ord Value", field: "avgOrderValue", render: d => d.avgOrderValue?.toFixed(2) },
                                { header: "Total Sales", field: "totalSales", render: d => d.totalSales?.toFixed(2) },
                                { header: "Last Ord Date", field: "lastOrderDate", render: d => d.lastOrderDate ? new Date(d.lastOrderDate).toLocaleDateString() : '' },
                                {
                                    header: "InActive 7 Days", field: "inActive7Days", render: d => d.inActive7Days ? "Yes" : "No", cellStyle: d => ({ backgroundColor: d.inActive7Days ? 'orange' : 'inherit' })
                                },
                                { header: "InActive 14 Days", field: "inActive14Days", render: d => d.inActive14Days ? "Yes" : "No", cellStyle: d => ({ backgroundColor: d.inActive14Days ? 'red' : 'inherit' }) },
                            ]}
                            renderExpandableContent={(data) => <ExpandableContent data={data} />}
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    )
}

export default SalesRepPerformance

