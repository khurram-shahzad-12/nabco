import { Box, Grid } from "@mui/material";
import StatCard from "./StatCard";
import PieChart from "./PieChart";
import CustomisedSnackBar from "../customisedSnackBar/CustomisedSnackBar";
import { defaultSnackState, getSalesTrackerData } from "../formFunctions/FormFunctions";
import { useEffect, useState } from "react";
import BarChart from "./BarChart";
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CurrencyPoundIcon from '@mui/icons-material/CurrencyPound';
import StoreMallDirectoryIcon from '@mui/icons-material/StoreMallDirectory';
import MoneyIcon from '@mui/icons-material/Money';
import ReceiptIcon from '@mui/icons-material/Receipt';

const BusinessReport = ({ startOfDate, endOfDate, reload, setReload }) => {
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [businessReportData, setBusinessReportData] = useState(null);

    const fetchBusinessReportData = () => {
        getSalesTrackerData({
            url: `api/salestracker/businessReportData?start_date=${startOfDate}&end_date=${endOfDate}`,
            setState: setBusinessReportData, setReload, setSnackState,
        });
    }

    useEffect(() => { fetchBusinessReportData() }, [startOfDate, endOfDate, reload])
    return (
        <Box >
            <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
            <Grid container spacing={1} >
                <Grid item xs={12} sm={6} md={1.7}>
                    <StatCard title={'Total Sales'} value={businessReportData?.summary?.currentYearSummary?.totalSale} growth={businessReportData?.summary?.growth?.totalSaleGrowth} isCurrency type={"dashboard"} StatIcon={PointOfSaleIcon}/>
                </Grid>
                <Grid item xs={12} sm={6} md={1.7}>
                    <StatCard title="Gross Profit" value={businessReportData?.summary?.currentYearSummary?.grossProfit} growth={businessReportData?.summary?.growth?.grossProfitGrowth} isCurrency type={"dashboard"} StatIcon={MoneyIcon}/>
                </Grid>
                <Grid item xs={12} sm={6} md={1.7}>
                    <StatCard title="Net Profit" value={businessReportData?.summary?.currentYearSummary?.netProfit} growth={businessReportData?.summary?.growth?.netProfitGrowth} isCurrency type={"dashboard"} StatIcon={CurrencyPoundIcon}/>
                </Grid>
                <Grid item xs={12} sm={6} md={1.7}>
                    <StatCard title="Devliery Sale Profit" value={businessReportData?.summary?.currentYearSummary?.totalDeliveryProfit} growth={businessReportData?.summary?.growth?.deliveryProfitGrowth} isCurrency type={"dashboard"} StatIcon={LocalShippingIcon}/>
                </Grid>
                <Grid item xs={12} sm={6} md={1.7}>
                    <StatCard title="Counter Sale Profit" value={businessReportData?.summary?.currentYearSummary?.totalCounterProfit} growth={businessReportData?.summary?.growth?.counterProfitGrowth} isCurrency type={"dashboard"} StatIcon={StoreMallDirectoryIcon}/>
                </Grid>
                <Grid item xs={12} sm={6} md={1.7}>
                    <StatCard title="Total Expenses" value={businessReportData?.summary?.currentYearSummary?.totalExpenses} growth={businessReportData?.summary?.growth?.expensesGrowth} isCurrency type={"dashboard"} StatIcon={MoneyOffIcon}/>
                </Grid>
                <Grid item xs={12} sm={6} md={1.7}>
                    <StatCard title="Total VAT" value={businessReportData?.summary?.currentYearSummary?.totalVat} growth={businessReportData?.summary?.growth?.totalVatGrowth} isCurrency type={"dashboard"} StatIcon={ReceiptIcon}/>
                </Grid>
                <Grid item xs={12} md={8}>
                    <BarChart
                        title='Monthly Sales & Gross Profit'
                        labels={businessReportData?.currentYearData?.map(item => item.month) || []}
                        data1={businessReportData?.currentYearData?.map(item => item.totalSale) || []}
                        data2={businessReportData?.currentYearData?.map(item => item.totalProfit) || []}
                        datasetLabel1='Actual Sales (£)'
                        datasetLabel2='Gross Profit (£)'
                    />
                </Grid>
                <Grid item xs={12} md={4}><PieChart
                    title='Monthly Total Orders'
                    labels={businessReportData?.currentYearData?.map(item => item.month) || []}
                    data={businessReportData?.currentYearData?.map(item => item.invoiceCount) || []}
                    legendPosition="top" /></Grid>
                <Grid item xs={12} md={6}>
                    <BarChart
                        title='Monthly Net profit & Expenses'
                        labels={businessReportData?.currentYearData?.map(item => item.month) || []}
                        data1={businessReportData?.currentYearData?.map(item => item.netProfit) || []}
                        data2={businessReportData?.currentYearData?.map(item => item.totalExpenses) || []}
                        datasetLabel1='Monthly Net Profit (£)'
                        datasetLabel2='Monthly Expenses (£)'
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <BarChart
                        title='Monthly Net Delivery & Counter Trade Profit'
                        labels={businessReportData?.currentYearData?.map(item => item.month) || []}
                        data1={businessReportData?.currentYearData?.map(item => item.deliveryProfit) || []}
                        data2={businessReportData?.currentYearData?.map(item => item.tradeCounterProfit) || []}
                        datasetLabel1='Net Delivery Profit (£)'
                        datasetLabel2='Net Counter Profit (£)'
                    />
                </Grid>
            </Grid>
        </Box>
    )
}

export default BusinessReport