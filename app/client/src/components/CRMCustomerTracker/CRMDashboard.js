import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import CRMMetricCard from './CRMMetricCard';
import BarChart from '../SalesTracker/BarChart';
import PieChart from '../SalesTracker/PieChart';
import CustomisedSnackBar from '../customisedSnackBar/CustomisedSnackBar'
import {defaultSnackState} from '../formFunctions/FormFunctions'
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { fetchAllEntriesAndSetRowData } from '../formFunctions/FormFunctions';

const CRMDashboard = ({startOfDate, endOfDate, reload, setReload}) => {
  const [snackState, setSnackState] = useState(defaultSnackState);
  const [dashboardData, setDashboardData] = useState([]);
  const [sendingData, setSendingData] = useState(false);

  const getCRMDashboardData = async () => {
     fetchAllEntriesAndSetRowData('/opportunities/CRMDashboard', { params: { start_date: startOfDate, end_date: endOfDate } }, setSendingData, setDashboardData, setSnackState);
     setReload(false);
  }

  useEffect(() => {
    getCRMDashboardData()
  }, [startOfDate, endOfDate, reload]); 

  return (
    <Box>
      <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
      {dashboardData && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <CRMMetricCard
              title="Total Lead"
              value={dashboardData.overall?.[0]?.totalLeads}
              icon={AssignmentIcon}
              type="dashboard"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <CRMMetricCard
              title="Total Opportunities"
              value={dashboardData.overall?.[0]?.totalOpps}
              icon={AssignmentIcon}
              type="dashboard"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <CRMMetricCard
              title="Win"
              value={dashboardData.overall?.[0]?.won}
              icon={CheckCircleIcon}
              type="dashboard"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <CRMMetricCard
              title="Lost"
              value={dashboardData.overall?.[0]?.lost}
              icon={CancelIcon}
              type="dashboard"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <CRMMetricCard
              title="Conversion Rate"
              value={`${Number(dashboardData.overall?.[0]?.conversion || 0).toFixed(2)}%`}
              icon={TrendingUpIcon}
              type="dashboard"
            />
          </Grid>
        </Grid>
      )}
      {dashboardData && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: 400 }}>
              <BarChart
                title="Opportunities by Stage"
                labels={dashboardData.byStage?.[0]?.labels}
                data1={dashboardData.byStage?.[0]?.data}
                height={360}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: 400 }}>
              <PieChart
                title="Win / Loss Ratio"
                labels={['Win', 'Lost']}
                data={[dashboardData.overall?.[0].won, dashboardData.overall?.[0]?.lost]}
                legendPosition="bottom"
                currencySymbol={false}
              />
            </Paper>
          </Grid>
        </Grid>
      )}
      {dashboardData && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Sales Rep Performance
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rep Name</TableCell>
                  <TableCell align="right">Leads</TableCell>
                  <TableCell align="right">Opportunities</TableCell>
                  <TableCell align="right">Win</TableCell>
                  <TableCell align="right">Lost</TableCell>
                  <TableCell align="right">Conversion %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboardData?.repDetails?.map((rep) => (
                  <TableRow key={rep.id}>
                    <TableCell component="th" scope="row">
                      {rep.name}
                    </TableCell>
                    <TableCell align="right">{rep.leads}</TableCell>
                    <TableCell align="right">{rep.opportunities}</TableCell>
                    <TableCell align="right">{rep.won}</TableCell>
                    <TableCell align="right">{rep.lost}</TableCell>
                    <TableCell align="right">{Number(rep.conversion || 0).toFixed(2)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default CRMDashboard;