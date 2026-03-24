import { Box, Grid, Paper, TablePagination } from "@mui/material"
import { defaultSnackState, getSalesTrackerData } from "../formFunctions/FormFunctions";
import { useEffect, useState, useMemo } from "react";
import ExpandableTable from "./ExpandableTable";
import CustomisedSnackBar from "../customisedSnackBar/CustomisedSnackBar";
import AsidePanel from "./AsidePanel";
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';

const OrderReport = ({ startOfDate, endOfDate, reload, setReload }) => {
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [orderData, setOrderData] = useState(null);
    const [page, setPage] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const fetchDashboardData = () => {
        getSalesTrackerData({
            url: `api/salestracker/orderReportData?start_date=${startOfDate}&end_date=${endOfDate}`,
            setState: setOrderData, setReload, setSearchTerm, setPage, setSnackState,
        });
    }

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const filteredOrders = useMemo(() => {
        if (!orderData?.[0].customers) return [];
        return orderData?.[0].customers?.filter((c) =>
            c.customerName?.toLowerCase().includes(searchTerm?.toLowerCase())
        );
    }, [orderData, searchTerm]);

    const paginatedOrders = useMemo(() => {
        const start = page * rowsPerPage;
        return filteredOrders.slice(start, start + rowsPerPage);
    }, [filteredOrders, page, rowsPerPage]);

    const summary = orderData?.[0].summary?.[0] || {};
    const stats = [
        { label: "Total Orders", value: summary.totalOrders ?? 0, CardIcon: ShoppingCartIcon },
        { label: "Total Sales", value: summary.totalSales?.toLocaleString() ?? 0, CardIcon: PointOfSaleIcon },
        { label: "Active Customers", value: summary.activeCustomers ?? 0, CardIcon: AccountBoxIcon },
        { label: "Average Order Value", value: summary.avgOrderValue ? summary.avgOrderValue.toFixed(2) : "0.00", CardIcon:CurrencyExchangeIcon },
    ];
    useEffect(() => { fetchDashboardData() }, [startOfDate, endOfDate, reload])

    return (
        <Box>
            <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <ExpandableTable
                            data={paginatedOrders}
                            keyProp="customerId"
                            columns={[
                                { header: "Customer Name", field: "customerName" },
                                { header: "Total Orders", field: "totalOrdersAll", align: "right" },
                                {
                                    header: "Revenue Generated", field: "totalRevenueAll", align: "right",
                                    render: (data) => `£ ${data.totalRevenueAll.toLocaleString()}`
                                },
                                {
                                    header: "Avg Order Value", field: "avgValueAll", align: "right",
                                    render: (data) => `£ ${data.avgValueAll.toLocaleString()}`
                                }
                            ]}
                            expandableColumns={[
                                { header: "Month", field: "month" },
                                { header: "Monthly Total Orders", field: "totalOrders", align: "right" },
                                {
                                    header: "Total Revenue (£)", field: "totalRevenue", align: "right",
                                    render: (data) => `£ ${data.totalRevenue.toLocaleString()}`
                                },
                                {
                                    header: "Avg Order Value (£)", field: "avgOrderValue", align: "right",
                                    render: (data) => `£ ${data.avgOrderValue.toLocaleString()}`
                                }
                            ]}
                            onRowClick={setSelectedOrder}
                        />
                        <TablePagination
                            component="div"
                            count={filteredOrders?.length}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={[5, 10, 20]}
                        />
                    </Paper>
                </Grid>
                <AsidePanel
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    stats={stats}
                    label="Search by Customer Name"
                    title={'Customer Monthly Order Range (£)'}
                    legendPosition={'top'}
                    labels={selectedOrder?.monthlySales?.map(s => s.month)}
                    data={selectedOrder?.monthlySales?.map(s => s.totalRevenue)}
                />
            </Grid>
        </Box>
    )
}

export default OrderReport