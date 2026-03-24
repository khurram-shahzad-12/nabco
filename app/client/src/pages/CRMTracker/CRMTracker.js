import React, { useState } from 'react';
import { Box, Container, Paper, Tabs, Tab, Typography, Button,} from '@mui/material';
import moment from 'moment';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CRMDashboard from '../../components/CRMCustomerTracker/CRMDashboard';
import SalesAgentPerformance from '../../components/CRMCustomerTracker/SalesAgentPerformance';
import DateRangeFilter from '../../components/Common/DateRangFilter';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement,} from 'chart.js';
ChartJS.register( CategoryScale, LinearScale, BarElement, ArcElement,Title, Tooltip, Legend );

const CRMTracker = () => {
    const [tabValue, setTabValue] = useState(0);
    const [startDate, setStartDate] = useState(moment().subtract(1, 'month').toDate());
    const [endDate, setEndDate] = useState(new Date());
    const [reload, setReload] = useState(false);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleDateChange = (newDate, dateType) => {
        if (dateType === 'start') { setStartDate(newDate);
        } else { setEndDate(newDate); }
    };
    return (
        <Box sx={{ flexGrow: 1 }}>
            <Container maxWidth="xl" sx={{ mb: 4 }}>
                <Paper sx={{ width: '100%' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        indicatorColor="primary"
                        textColor="primary"
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab label="CRM Overview" icon={<AssessmentIcon />} iconPosition="start" />
                        <Tab label="Telesales Performance" icon={<PeopleIcon />} iconPosition="start" />
                    </Tabs>
                </Paper>
                <Box sx={{ display: { xs: 'block', lg: 'flex' }, justifyContent: 'space-between', mt: 2 }}>
                    <Box>
                        <Typography variant="h4" sx={{ mt: 2, color: 'primary.main', borderBottom: 2 }}>
                            {tabValue === 0 && 'CRM Dashboard'}
                            {tabValue === 1 && 'Telesales Performance'}
                        </Typography>
                    </Box>
                    <Box sx={{ display:'flex', mt: { xs: 2, lg: 0, alignItems:'center' } }}>
                        <DateRangeFilter
                        startDate={startDate}
                        endDate={endDate}
                        onDateChange={handleDateChange}
                        />
                        <Button variant="contained" sx={{ ml: 2 }} onClick={() => setReload(true)}>Reload</Button>
                    </Box>
                </Box>
                <Box sx={{ py: 3 }}>
                    {tabValue === 0 && (
                        <CRMDashboard
                            startOfDate={startDate}
                            endOfDate={endDate}
                            reload={reload}
                            setReload={setReload}
                        />
                    )}
                    {tabValue === 1 && (
                        <SalesAgentPerformance
                            startOfDate={startDate}
                            endOfDate={endDate}
                            reload={reload}
                            setReload={setReload}
                        />
                    )}
                </Box>
            </Container>
        </Box>
    );
};

export default CRMTracker;