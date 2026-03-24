import React, { useState, useEffect } from 'react';
import { Box, Container, Paper, Tabs, Tab, Button, } from '@mui/material';
import { fetchAllEntriesAndSetRowData, defaultSnackState } from '../../components/formFunctions/FormFunctions';
import moment from 'moment';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import AddIcon from "@mui/icons-material/Add";
import AssessmentIcon from '@mui/icons-material/Assessment';
import DateRangeFilter from '../../components/Common/DateRangFilter';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, } from 'chart.js';
import { CRM } from '../../components/CRMManagement/CRM';
import Quotations from '../../components/CRMManagement/Quotations';
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);
const API_LEAD = '/lead';

const CRMManagement = () => {
    const [tabValue, setTabValue] = useState(0);
    const [startDate, setStartDate] = useState(moment().subtract(1, 'month').toDate());
    const [endDate, setEndDate] = useState(new Date());
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [sendingData, setSendingData] = useState(false);
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [rowData, setRowData] = useState([]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleDateChange = (newDate, dateType) => {
        if (dateType === 'start') { setStartDate(newDate);
        } else { setEndDate(newDate); }
    };
    const fetchAllLeads = () => {
        fetchAllEntriesAndSetRowData(API_LEAD, { params: { start_date: startDate, end_date: endDate } }, setSendingData, setRowData, setSnackState);
    };
    useEffect(() => { fetchAllLeads(); }, [startDate, endDate]);
    return (
        <Box sx={{ flexGrow: 1 }}>
            <Container maxWidth="xl" sx={{ mb: 2 }}>
                <Paper sx={{ width: '100%' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        indicatorColor="primary"
                        textColor="primary"
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab label="CRM" icon={<AssessmentIcon />} iconPosition="start" />
                        <Tab label="Quotations" icon={<RequestQuoteIcon />} iconPosition="start" />
                    </Tabs>
                </Paper>
                <Box sx={{ display: { xs: 'block', lg: 'flex' }, justifyContent: 'space-between', mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: "center" }}>
                        {tabValue === 0 && (<Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenAddDialog(true)}
                            sx={{ mr: 2 }}
                        >
                            Add Lead
                        </Button>)}
                    </Box>
                    {tabValue !== 1 && (<Box sx={{ display: 'flex', mt: { xs: 2, lg: 0, alignItems: 'center' } }}>
                        <DateRangeFilter
                            startDate={startDate}
                            endDate={endDate}
                            onDateChange={handleDateChange}
                        />
                        <Button variant="contained" sx={{ ml: 2 }} onClick={() => fetchAllLeads()}>Reload</Button>
                    </Box>)}
                </Box>
                <Box>
                    {tabValue === 0 && (
                        <CRM
                            openAddDialog={openAddDialog}
                            onDialogClose={() => setOpenAddDialog(false)}
                            fetchAllLeads={fetchAllLeads}
                            rowData={rowData}
                            snackState={snackState}
                            setSnackState={setSnackState}
                        />
                    )}
                    {tabValue === 1 && (<Quotations/>)}

                </Box>
            </Container>
        </Box>
    );
};

export default CRMManagement;