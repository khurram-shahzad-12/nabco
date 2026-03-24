import React from 'react';
import { Dialog, DialogTitle, DialogContent, List, ListItem, ListItemIcon, ListItemText, Divider, } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CallIcon from '@mui/icons-material/Call';
import MailIcon from '@mui/icons-material/Mail';
import NoteIcon from '@mui/icons-material/Note';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import StageIcon from '@mui/icons-material/Timeline';
import HistoryIcon from '@mui/icons-material/History';
import { Box, Typography, IconButton, Grid, Card, CardHeader, CardContent, Chip } from '@mui/material';

const LeadDetailDialog = ({ open, onClose, selectedLead, formatDate, getStageColor }) => {
    if (!selectedLead) return null;
    const leadFields = [
        { label: "Contact", value: selectedLead.contact_name, highlight: true },
        { label: "Customer", value: selectedLead.customer_name },
        { label: "Phone", value: selectedLead.phone },
        { label: "Email", value: selectedLead.email },
        { label: "Lead Source", value: selectedLead.lead_source, highlight: true },
        { label: "Assigned To", value: selectedLead.assignedToName, highlight: true },
        { label: "Created", value: formatDate(selectedLead.createdAt) },
    ];
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{ sx: { bgcolor: '#2a2a2a', color: 'text.primary', border: '2px solid', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 3, } }}
        >
            <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" color="text.primary">
                        Lead Details: {selectedLead?.contact_name}
                    </Typography>
                    <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ bgcolor: '#1e1e1e', borderColor: 'rgba(255,255,255,0.12)' }}>
                {selectedLead && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Grid container spacing={3} direction="column">
                                <Grid item>
                                    <Card
                                        variant="outlined"
                                        sx={{
                                            boxShadow: '0px 4px 20px rgba(0,0,0,0.5)',
                                            borderColor: 'rgba(255,255,255,0.5)',
                                        }}
                                    >
                                        <CardHeader
                                            avatar={<PersonIcon sx={{ color: 'primary.main' }} />}
                                            title="Lead Information"
                                            titleTypographyProps={{ variant: 'subtitle1', color: 'text.primary' }}
                                        />
                                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.5)' }} />
                                        <CardContent sx={{ p: 3 }}>
                                            <Box
                                                sx={{
                                                    display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                                    gap: 0, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden',
                                                }}
                                            >
                                                <Box sx={{ p: 2, borderBottom: '1px solid', borderRight: { xs: 0, sm: '1px solid' }, borderColor: 'divider', bgcolor: 'action.hover' }}>
                                                    <Typography variant="caption" color="text.secondary" component="span">Contact: </Typography>
                                                    <Typography variant="body1" component="span" pl={1}>{selectedLead.contact_name}</Typography>
                                                </Box>
                                                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                                                    <Typography variant="caption" color="text.secondary" component="span">Customer: </Typography>
                                                    <Typography variant="body1" component="span" pl={1}>{selectedLead.customer_name || '-'}</Typography>
                                                </Box>
                                                <Box sx={{ p: 2, borderBottom: '1px solid', borderRight: { xs: 0, sm: '1px solid' }, borderColor: 'divider' }}>
                                                    <Typography variant="caption" color="text.secondary" component="span">Phone: </Typography>
                                                    <Typography variant="body1" component="span" pl={1}>{selectedLead.phone || '-'}</Typography>
                                                </Box>
                                                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                                    <Typography variant="caption" color="text.secondary" component="span">Email: </Typography>
                                                    <Typography variant="body1" component="span" pl={1}>{selectedLead.email || '-'}</Typography>
                                                </Box>
                                                <Box sx={{ p: 2, borderBottom: '1px solid', borderRight: { xs: 0, sm: '1px solid' }, borderColor: 'divider', bgcolor: 'action.hover' }}>
                                                    <Typography variant="caption" color="text.secondary" component="span">Lead Source: </Typography>
                                                    <Typography variant="body1" component="span" pl={1}>{selectedLead.lead_source || '-'}</Typography>
                                                </Box>
                                                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                                                    <Typography variant="caption" color="text.secondary" component="span">Assigned To: </Typography>
                                                    <Typography variant="body1" component="span" pl={1}>{selectedLead.assignedToName || '-'}</Typography>
                                                </Box>
                                                <Box sx={{ p: 2 }}>
                                                    <Typography variant="caption" color="text.secondary" component="span">Created: </Typography>
                                                    <Typography variant="body1" component="span" pl={1}>{formatDate(selectedLead.createdAt)}</Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item>
                                    <Card
                                        variant="outlined"
                                        sx={{ boxShadow: '0px 4px 20px rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.5)', }}
                                    >
                                        <CardHeader
                                            avatar={<StageIcon sx={{ color: 'info.main' }} />}
                                            title="Opportunities"
                                            titleTypographyProps={{ variant: 'subtitle1', color: 'text.primary' }}
                                        />
                                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.5)' }} />
                                        <CardContent sx={{ maxHeight: 300, overflow: 'auto' }}>
                                            {selectedLead.opportunities?.length > 0 ? (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    {selectedLead.opportunities.map((opp, idx) => (
                                                        <Box
                                                            key={idx}
                                                            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', bgcolor: idx % 2 === 0 ? 'action.hover' : 'inherit', }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    display: 'grid',
                                                                    gridTemplateColumns: '1fr 1fr',
                                                                    borderBottom: opp.closing_note ? '1px solid' : 0,
                                                                    borderColor: 'divider',
                                                                }}
                                                            >
                                                                <Box sx={{ p: 2, borderRight: '1px solid', borderColor: 'divider' }}>
                                                                    <Typography variant="caption" color="text.secondary" component="span">Stage: </Typography>
                                                                    <Chip label={opp.stage} size="small" color={getStageColor(opp.stage)} sx={{ ml: 1 }} />
                                                                </Box>
                                                                <Box sx={{ p: 2 }}>
                                                                    <Typography variant="caption" color="text.secondary" component="span">Expected Close: </Typography>
                                                                    <Typography variant="body1" component="span">{formatDate(opp.expected_close_date)}</Typography>
                                                                </Box>
                                                            </Box>
                                                            {opp.closing_note && (
                                                                <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                                                                    <Typography variant="caption" color="text.secondary" component="span">Final Note: </Typography>
                                                                    <Typography variant="body1" component="span" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                                        {opp.closing_note}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    ))}
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary" align="center">
                                                    No opportunities
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card
                                variant="outlined"
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    boxShadow: '0px 4px 20px rgba(0,0,0,0.5)',
                                    borderColor: 'rgba(255,255,255,0.5)',
                                }}
                            >
                                <CardHeader
                                    avatar={<HistoryIcon sx={{ color: 'success.main' }} />}
                                    title="Activity Logs"
                                    titleTypographyProps={{ variant: 'subtitle1', color: 'text.primary' }}
                                />
                                <Divider sx={{ borderColor: 'rgba(255,255,255,0.5)' }} />
                                <CardContent sx={{ flex: 1, overflow: 'auto', maxHeight: 500 }}>
                                    {selectedLead.activities?.length > 0 ? (
                                        <List dense disablePadding>
                                            {selectedLead.activities.map((act, idx) => (
                                                <ListItem key={idx} divider={idx < selectedLead.activities.length - 1} alignItems="flex-start" sx={{ px: 0 }}>
                                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                                        {act.type === 'call' && <CallIcon fontSize="small" sx={{ color: 'primary.light' }} />}
                                                        {act.type === 'email' && <MailIcon fontSize="small" sx={{ color: 'info.light' }} />}
                                                        {act.type === 'meeting' && <EventIcon fontSize="small" sx={{ color: 'warning.light' }} />}
                                                        {act.type === 'note' && <NoteIcon fontSize="small" sx={{ color: 'action.active' }} />}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={
                                                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                                                <Typography variant="body2" fontWeight="medium" color="text.primary">{act.subject}</Typography>
                                                                <Chip
                                                                    label={formatDate(act.createdAt)}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ borderColor: 'rgba(255,255,255,0.2)' }}
                                                                />
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Typography variant="body2" color="text.secondary">
                                                                {act.description}
                                                            </Typography>
                                                        }
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" align="center">
                                            No activities yet
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default LeadDetailDialog