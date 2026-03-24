import React from 'react';
import {
    Button, Dialog, DialogContent, DialogTitle, Grid, TextField,
    MenuItem, InputLabel, FormControl, Select, Box, Card, CardHeader,
    CardContent, Divider, IconButton, Typography, List, ListItem,
    ListItemIcon, ListItemText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CampaignIcon from '@mui/icons-material/Campaign';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import NotesIcon from '@mui/icons-material/Notes';
import CloseIcon from '@mui/icons-material/Close';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import SourceIcon from '@mui/icons-material/Source';
import HistoryIcon from '@mui/icons-material/History';
import EditIcon from "@mui/icons-material/Edit";
import CallIcon from '@mui/icons-material/Call';
import MailIcon from '@mui/icons-material/Mail';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import NoteIcon from '@mui/icons-material/Note';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import DatePicker from "@mui/lab/DatePicker";
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';

const CRMDialog = ({
    open,
    onClose,
    editMode,
    formValues,
    setFormValues,
    onSave,
    onAddActivity,
    requiredWritePermissions,
    currentUserHasPermissions,
    stageOptions,
    leadSourceOptions,
    salesReps,
    activityTypes,
    newActivityType,
    setNewActivityType,
    newActivitySubject,
    setNewActivitySubject,
    newActivityDescription,
    setNewActivityDescription,
    inputChangeListener,
    handleCloseDateChange,
    expectedCloseDate,
    customers,
}) => {
    return (
        <Dialog open={open} maxWidth="lg" fullWidth scroll="paper" onClose={onClose}>
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box display="flex" alignItems="center" gap={1}>
                    {editMode ? <EditIcon color="primary" /> : <AddIcon color="primary" />}
                    <span>{editMode ? "Edit Deal" : "Create New Deal"}</span>
                </Box>
                <IconButton onClick={onClose}><CloseIcon /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent dividers>
                <form>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Grid container spacing={3} direction="column">
                                <Grid item>
                                    <Card variant="outlined">
                                        <CardHeader avatar={<PersonIcon color="primary" />} title="Lead Details" />
                                        <Divider />
                                        <CardContent>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        fullWidth size="small" label="Customer Name" name="customer_name"
                                                        value={formValues?.customer_name || ''}
                                                        onChange={inputChangeListener}
                                                        InputProps={{ startAdornment: <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} /> }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        fullWidth size="small" label="Contact Name" name="contact_name"
                                                        value={formValues?.contact_name || ''}
                                                        onChange={inputChangeListener}
                                                        InputProps={{ startAdornment: <PersonIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} /> }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        fullWidth size="small" label="Phone" name="phone"
                                                        value={formValues?.phone || ''}
                                                        onChange={inputChangeListener}
                                                        InputProps={{ startAdornment: <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} /> }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        fullWidth size="small" label="Email" name="email"
                                                        value={formValues?.email || ''}
                                                        onChange={inputChangeListener}
                                                        InputProps={{ startAdornment: <EmailIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} /> }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <FormControl fullWidth size="small">
                                                        <InputLabel>Lead Source</InputLabel>
                                                        <Select
                                                            name="lead_source"
                                                            value={formValues?.lead_source || ''}
                                                            onChange={inputChangeListener}
                                                            label="Lead Source"
                                                            startAdornment={<SourceIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />}
                                                        >
                                                            <MenuItem value=""><em>None</em></MenuItem>
                                                            {leadSourceOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <FormControl fullWidth size="small">
                                                        <InputLabel>Assigned Rep</InputLabel>
                                                        <Select
                                                            name="assigned_to"
                                                            value={formValues?.assigned_to?._id || formValues?.assigned_to || ''}
                                                            onChange={inputChangeListener}
                                                            label="Assigned Rep"
                                                            startAdornment={<AssignmentIndIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />}
                                                        >
                                                            <MenuItem value=""><em>None</em></MenuItem>
                                                            {salesReps.map(rep => <MenuItem key={rep._id} value={rep._id}>{rep.name}</MenuItem>)}
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        fullWidth size="small" label="Created At"
                                                        value={formValues?.createdAt ? new Date(formValues.createdAt).toLocaleDateString('en-GB') : ''}
                                                        InputProps={{ readOnly: true, startAdornment: <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} /> }}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item>
                                    <Card variant="outlined">
                                        <CardHeader avatar={<CampaignIcon color="primary" />} title="Deal Details" />
                                        <Divider />
                                        <CardContent>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                    <FormControl fullWidth size="small">
                                                        <InputLabel>Stage</InputLabel>
                                                        <Select
                                                            name="stage"
                                                            value={formValues.stage ? formValues.stage : formValues?.opportunities?.stage ? formValues?.opportunities?.stage : ''}
                                                            onChange={inputChangeListener}
                                                            label="Stage"
                                                            startAdornment={<CampaignIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />}
                                                        >
                                                            {stageOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                                        <DatePicker
                                                            label="Expected Close Date"
                                                            value={expectedCloseDate ? new Date(expectedCloseDate) : null}
                                                            onChange={handleCloseDateChange}
                                                            inputFormat="dd/MM/yyyy"
                                                            renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                                                        />
                                                    </LocalizationProvider>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <TextField
                                                        fullWidth multiline rows={3} label="Closing Note (Won/Lost Reason)" name="closing_note"
                                                        value={formValues.closing_note ? formValues.closing_note : formValues?.opportunities?.closing_note ? formValues?.opportunities?.closing_note : ''}
                                                        onChange={inputChangeListener}
                                                        InputProps={{ startAdornment: <NotesIcon fontSize="small" sx={{ mr: 1, color: 'action.active', alignSelf: 'flex-start', mt: 1 }} /> }}
                                                    />
                                                </Grid>
                                            </Grid>
                                            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                                <Button
                                                    variant="contained"
                                                    startIcon={<AddIcon />}
                                                    onClick={onSave}
                                                    disabled={!currentUserHasPermissions(requiredWritePermissions)}
                                                >
                                                    Save Changes
                                                </Button>
                                                <Button variant="outlined" onClick={onClose}>Cancel</Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <CardHeader avatar={<HistoryIcon color="primary" />} title="Activity Log" />
                                <Divider />
                                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ flexGrow: 1, overflow: 'auto', maxHeight: 300, mb: 2 }}>
                                        <List dense>
                                            {formValues?.activities?.length === 0 ? (
                                                <Typography variant="body2" color="textSecondary">No activities yet.</Typography>
                                            ) : (
                                                [...(formValues?.activities) || []].filter(Boolean).reverse().map(act => (
                                                    <ListItem key={act._id} alignItems="flex-start">
                                                        <ListItemIcon>
                                                            {act.type === 'call' && <CallIcon />}
                                                            {act.type === 'email' && <MailIcon />}
                                                            {act.type === 'meeting' && <MeetingRoomIcon />}
                                                            {act.type === 'note' && <NoteIcon />}
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={
                                                                <React.Fragment>
                                                                    <Typography component="span" variant="body2" color="text.primary">{act.subject}</Typography>
                                                                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                                                        {new Date(act.createdAt).toLocaleString()}
                                                                    </Typography>
                                                                </React.Fragment>
                                                            }
                                                            secondary={act.description}
                                                        />
                                                    </ListItem>
                                                ))
                                            )}
                                        </List>
                                    </Box>
                                    <Divider sx={{ my: 2 }} />
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Type</InputLabel>
                                                <Select value={newActivityType} onChange={(e) => setNewActivityType(e.target.value)} label="Type">
                                                    {activityTypes.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField fullWidth size="small" label="Subject" value={newActivitySubject} onChange={(e) => setNewActivitySubject(e.target.value)} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField fullWidth multiline rows={3} label="Description" value={newActivityDescription} onChange={(e) => setNewActivityDescription(e.target.value)} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <Button
                                                    variant="contained"
                                                    startIcon={<AddIcon />}
                                                    onClick={onAddActivity}
                                                    disabled={!currentUserHasPermissions(requiredWritePermissions) || !newActivityDescription.trim()}
                                                >
                                                    Add Activity
                                                </Button>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CRMDialog;