
import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, TextField, InputAdornment,
  Card, CardContent, Avatar, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton,
  Chip, TablePagination, Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CustomisedSnackBar from '../../components/customisedSnackBar/CustomisedSnackBar';
import CRMMetricCard from '../../components/CRMCustomerTracker/CRMMetricCard';
import BarChart from '../SalesTracker/BarChart';
import PieChart from '../SalesTracker/PieChart';
import { defaultSnackState, fetchAllEntriesAndSetRowData } from '../../components/formFunctions/FormFunctions';
import LeadDetailDialog from '../../components/CRMCustomerTracker/LeadDetailDialog';

const SalesAgentPerformance = ({ startOfDate, endOfDate, reload, setReload }) => {
  const [snackState, setSnackState] = useState(defaultSnackState);
  const [sendingData, setSendingData] = useState(false);
  const [reps, setReps] = useState([]);
  const [selectedRepId, setSelectedRepId] = useState("");
  const [searchTerm, setSearchTerm] = useState('');
  const [teleSalesDashboardData, setTeleSalesDashboardData] = useState([]);
  const [singleRepData, setSingleRepData] = useState({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
  const [leadPage, setLeadPage] = useState(0);
  const [leadLimit, setLeadLimit] = useState(5);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadDetailDialogOpen, setLeadDetailDialogOpen] = useState(false);
  const API_SALES_REPS = '/customerSalesRep';
  const API_TELE_SALES = '/opportunities/teleSalesDashboard';
  const API_LEAD = '/lead/getAllLeadOfSingleRep';

  const fetchTelesalesRep = () => {
    fetchAllEntriesAndSetRowData(API_SALES_REPS, null, setSendingData, setReps, setSnackState); setReload(false)
  };

  const fetchTelesalesDashboardData = async () => {
    fetchAllEntriesAndSetRowData(API_TELE_SALES, { params: { repId: selectedRepId, start_date: startOfDate, end_date: endOfDate } }, setSendingData, setTeleSalesDashboardData, setSnackState);
  };

  const fetchAllLeadOfSingleRepData = async (page = leadPage + 1, limit = leadLimit) => {
    const params = {
      start_date: startOfDate,
      end_date: endOfDate,
      page,
      limit
    };
    if (selectedRepId) { params.repId = selectedRepId; }
    fetchAllEntriesAndSetRowData(API_LEAD, { params }, setSendingData, setSingleRepData, setSnackState);
  };

  useEffect(() => { fetchTelesalesRep(); }, []);
  useEffect(() => { fetchTelesalesDashboardData(); }, [startOfDate, endOfDate, selectedRepId, reload]);

  useEffect(() => {
    if (selectedRepId !== undefined) {
      fetchAllLeadOfSingleRepData(leadPage + 1, leadLimit);
    }
  }, [selectedRepId, startOfDate, endOfDate, leadPage, leadLimit]);

  const handleRepSelect = (repId) => {
    setSelectedRepId(repId);
    setLeadPage(0);
  };

  const handleViewLeadDetails = (lead) => {
    setSelectedLead(lead);
    setLeadDetailDialogOpen(true);
  };

  const handleChangePage = (event, newPage) => { setLeadPage(newPage); };
  const handleChangeRowsPerPage = (event) => {
    setLeadLimit(parseInt(event.target.value, 10));
    setLeadPage(0);
  };

  const filteredReps = reps.filter(rep =>
    rep.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : '-';
  const getStageColor = (stage) => {
    switch (stage) {
      case 'closed Win': return 'success';
      case 'closed Lost': return 'error';
      case 'negotiation': return 'warning';
      case 'proposal': return 'info';
      case 'qualified': return 'primary';
      case 'prospecting': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              Telesales Team
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <Box sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <Card
                sx={{
                  mb: 1, cursor: 'pointer',
                  border: selectedRepId === '' ? '2px solid #3f51b5' : '1px solid transparent',
                  bgcolor: selectedRepId === '' ? 'action.selected' : 'inherit',
                }}
                onClick={() => handleRepSelect('')}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="subtitle1">All Telesales</Typography>
                </CardContent>
              </Card>
              {filteredReps.map((rep) => (
                <Card
                  key={rep._id}
                  sx={{
                    mb: 1, cursor: 'pointer',
                    border: selectedRepId === rep._id ? '2px solid #3f51b5' : '1px solid transparent',
                    bgcolor: selectedRepId === rep._id ? 'action.selected' : 'inherit',
                  }}
                  onClick={() => handleRepSelect(rep._id)}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 40, height: 40 }}>
                        {rep.name?.slice(0, 2).toUpperCase()}
                      </Avatar>
                      <Typography variant="subtitle1">{rep.name}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={9}>
          {teleSalesDashboardData && (
            <>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <CRMMetricCard
                    title="Total Opportunities"
                    value={teleSalesDashboardData.overall?.[0]?.totalOpps}
                    icon={AssignmentIcon}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <CRMMetricCard
                    title="Win"
                    value={teleSalesDashboardData.overall?.[0]?.won}
                    icon={CheckCircleIcon}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <CRMMetricCard
                    title="Lost"
                    value={teleSalesDashboardData.overall?.[0]?.lost}
                    icon={CancelIcon}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <CRMMetricCard
                    title="Conversion Rate"
                    value={`${Number(teleSalesDashboardData.overall?.[0]?.conversion).toFixed(2)}%`}
                    icon={TrendingUpIcon}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 2, height: 400 }}>
                    <BarChart
                      title="Opportunities by Stage"
                      labels={teleSalesDashboardData.byStage?.[0]?.labels}
                      data1={teleSalesDashboardData.byStage?.[0]?.data}
                      datasetLabel1="Count"
                      height={360}
                    />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, height: 400 }}>
                    <PieChart
                      title="Win / Loss Ratio"
                      labels={['Win', 'Lost']}
                      data={[teleSalesDashboardData.overall?.[0]?.won, teleSalesDashboardData.overall?.[0]?.lost]}
                      legendPosition="bottom"
                      currencySymbol={false}
                    />
                  </Paper>
                </Grid>
              </Grid>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedRepId ? 'Leads for Selected Rep' : 'All Leads'}
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Contact</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Stage</TableCell>
                        <TableCell>Expected Close</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {singleRepData.data.map((lead) => (
                        <TableRow key={lead.id} hover>
                          <TableCell>{lead.contact_name}</TableCell>
                          <TableCell>{lead.customer_name || '-'}</TableCell>
                          <TableCell>{lead.phone || '-'}</TableCell>
                          <TableCell>{lead.email || '-'}</TableCell>
                          <TableCell>
                            {lead.stage ? (
                              <Chip
                                label={lead.stage}
                                size="small"
                                color={getStageColor(lead.stage)}
                              />
                            ) : '-'}
                          </TableCell>
                          <TableCell>{formatDate(lead.expected_close_date)}</TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Details">
                              <IconButton size="small" onClick={() => handleViewLeadDetails(lead)}>
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      {singleRepData.data.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
                            No leads found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={singleRepData.pagination.total}
                  page={leadPage}
                  onPageChange={handleChangePage}
                  rowsPerPage={leadLimit}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                />
              </Paper>
            </>
          )}
        </Grid>
      </Grid>
      <LeadDetailDialog
        open={leadDetailDialogOpen}
        onClose={() => setLeadDetailDialogOpen(false)}
        selectedLead={selectedLead}
        formatDate={formatDate}
        getStageColor={getStageColor}
      />
    </Box>
  );
};

export default SalesAgentPerformance;