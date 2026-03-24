import React, { useEffect, useState } from 'react';
import displaySnackState from "../customisedSnackBar/DisplaySnackState";
import CustomisedSnackBar from "../customisedSnackBar/CustomisedSnackBar";
import { LoadingButton } from "../loadingButton/LoadingButton";
import {
  fetchAllEntriesAndSetRowData,
  getColumnDefs,
  getDefaultFormFields,
  handleDataSubmit,
  handleDataEditSubmit,
  currentUserHasPermissions,
  handleDeleteEntry
} from "../formFunctions/FormFunctions";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import SourceIcon from '@mui/icons-material/Source';
import FlagIcon from '@mui/icons-material/Flag';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import MarkunreadMailboxIcon from '@mui/icons-material/MarkunreadMailbox';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete'
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  Button, Dialog, Chip, DialogContent, DialogTitle, Grid, TextField,
  MenuItem, InputLabel, FormControl, Select, Box, Card, CardHeader,
  CardContent, Divider, IconButton
} from "@mui/material";
import DataViewGrid from '../DataViewGrid/DataViewGrid';
import Autocomplete from '@mui/material/Autocomplete';
import { useNavigate } from "react-router-dom";
import axiosDefault from '../axiosDefault/axiosDefault';
import CRMDialog from './CRMDialog';

const API_LEAD = '/lead';
const API_SALES_REPS = '/customerSalesRep';
const API_CUSTOMER = '/customer';
const API_OPPORTUNITY = '/opportunities';
const API_ACTIVITIES = '/activities';

export const CRM = ({ openAddDialog, onDialogClose, fetchAllLeads, rowData, snackState, setSnackState }) => {
  const axios = axiosDefault();
  const [sendingData, setSendingData] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [crmDialogOpen, setCrmDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [salesReps, setSalesReps] = useState([]);
  const [customers, setCustomers] = useState([]);
  const navigate = useNavigate();
  const requiredWritePermissions = [process.env.REACT_APP_WRITE_CUSTOMER_SALES_REP_PERMISSION];

  const [formValues, setFormValues] = useState({});
  const [newActivityType, setNewActivityType] = useState('note');
  const [newActivitySubject, setNewActivitySubject] = useState('');
  const [newActivityDescription, setNewActivityDescription] = useState('');

  const fetchSalesReps = () => {
    fetchAllEntriesAndSetRowData(API_SALES_REPS, null, setSendingData, setSalesReps, setSnackState);
  };
  const fetchCustomers = () => {
    fetchAllEntriesAndSetRowData(API_CUSTOMER, null, setSendingData, setCustomers, setSnackState);
  };

  useEffect(() => {
    fetchAllLeads();
    fetchSalesReps();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (openAddDialog) {
      setEditMode(false);
      setDialogOpen(true);
    }
  }, [openAddDialog]);

  const leadFields = [
    { field: "customer_name", label: "Customer Name", type: "textfield", textFieldProps: { required: true } },
    { field: "contact_name", label: "Contact Name", type: "textfield", textFieldProps: { required: true }, gridWidth: 150 },
    { field: "phone", label: "Phone", type: "textfield", gridWidth: 120 },
    { field: "email", label: "Email", type: "textfield", gridWidth: 140 },
    { field: "lead_source", label: "Lead Source", type: "select", gridWidth: 130 },
    { field: "assigned_to", label: "Assigned To", type: "select" },
  ];

  const defaultFormState = {
    ...getDefaultFormFields(leadFields),
    assigned_to: null,
    customer: null,
  };

  const [addFormValues, setAddFormValues] = useState({ ...defaultFormState });
  const inputChangeListener = (event) => {
    const { name, value } = event.target;
    setAddFormValues(prev => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    handleDataSubmit(API_LEAD, event, setSendingData, addFormValues, setAddFormValues, defaultFormState, setSnackState, fetchAllLeads);
  };
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setAddFormValues(defaultFormState);
    onDialogClose && onDialogClose();
  };
  const fetchLeadById = async (leadId) => {
    if (!leadId) return;
    try {
      setSendingData(true);
      const resp = await axios.get(`${process.env.REACT_APP_URL_ROOT}/api/lead/${leadId}`);
      setFormValues({
        ...resp.data,
        customer: resp.data.customer?._id || resp.data.customer,
        opportunities: resp.data.opportunities?.[0] || {},
        activities: resp.data.activities || []
      });
      displaySnackState('Lead loaded', 'success', setSnackState);
      setSendingData(false);
    } catch (error) {
      console.error("Error fetching lead data", error);
      displaySnackState(`Failed to load lead data - ${error.response?.data || error.message}`, "error", setSnackState);
      setSendingData(false);
    }
  };
  const handleEditClick = (row) => {
    fetchLeadById(row._id).then(() => {
      setEditMode(true);
      setCrmDialogOpen(true);
    });
  };
  const handleSaveCRM = async () => {
    const leadData = {
      _id: formValues._id,
      customer_name: formValues.customer_name,
      contact_name: formValues.contact_name,
      phone: formValues.phone,
      email: formValues.email,
      lead_source: formValues.lead_source,
      assigned_to: formValues.assigned_to?._id || formValues.assigned_to,
      notes: formValues.notes,
      customer: formValues.customer?._id || formValues.customer
    };
    const oppData = {
      _id: formValues._id,
      stage: formValues.stage,
      expected_close_date: formValues.expected_close_date,
      closing_note: formValues.closing_note,
      converted_to_customer: formValues.converted_to_customer || false
    };
    handleDataEditSubmit(API_LEAD, null, setSendingData, () => { displaySnackState("updated successfully", "success", setSnackState); }, leadData, () => { }, null, setSnackState, fetchAllLeads);
    if (oppData._id) {
      handleDataEditSubmit(API_OPPORTUNITY, null, setSendingData, () => { displaySnackState("updated successfully", "success", setSnackState); }, oppData, () => { }, null, setSnackState, fetchAllLeads);
    }
    handleCloseCrmDialog();
  };
  const handleAddActivity = async () => {
    const newActivityData = {
      type: newActivityType,
      subject: newActivitySubject,
      description: newActivityDescription,
      lead: formValues._id,
    };
    handleDataSubmit(API_ACTIVITIES, null, setSendingData, newActivityData, () => { }, null, setSnackState, async () => {
      setNewActivityType('note');
      setNewActivitySubject('');
      setNewActivityDescription('');
      await fetchLeadById(formValues._id);
      fetchAllLeads();
    });
  };
  const handleCloseCrmDialog = () => {
    setCrmDialogOpen(false);
    setEditMode(false);
    setFormValues({});
    setNewActivityDescription('');
  };
  const handleCloseDateChange = (date) => {
    setFormValues(prev => ({
      ...prev,
      expected_close_date: date ? date.toISOString().split('T')[0] : ''
    }));
  };
  const handleCustomerChange = (event, newValue) => {
    setAddFormValues(prev => ({ ...prev, 
      customer: newValue ? newValue._id : '',
      customer_name: newValue ? newValue.customer_name : '',
      contact_name : newValue ? newValue.contact_name : '',
      phone: newValue ? newValue.phone : '',
      email: newValue ? newValue.email : '',
      address: newValue ? newValue.address : '',
      city: newValue ? newValue.city : '',
      postcode: newValue.postcode ? newValue.postcode : '',
     }))
  }
  const baseColDefs = getColumnDefs(leadFields);
  const handleDeleteClick = async (row) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    handleDeleteEntry(API_LEAD, row._id, setSendingData, setSnackState, fetchAllLeads)
  };
  const actionColDef = {
    field: "actions",
    headerName: "Actions",
    width: 180,
    cellRenderer: (params) => (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <IconButton
          size="small"
          color="primary"
          onClick={() => handleEditClick(params.data)}
          title="Edit Lead"
        >
          <EditIcon />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={() => handleDeleteClick(params.data)}
          title="Delete Lead"
        >
          <DeleteIcon />
        </IconButton>
        <IconButton
          size="small"
          color="secondary"
          onClick={() => {
            const customerId = params.data.customer?._id || params.data.customer;
            if (customerId) {
              navigate(`/Customer/Customer`, { state: { id: customerId, telesalesRep: params.data?.assigned_to || null } });
            } else {
              navigate("/Customer/Customer", {
                state: {
                  openDialog: true,
                  customer_name: params.data.customer_name,
                  contact_name: params.data.contact_name,
                  email: params.data.email,
                  phone: params.data.phone,
                  address: params.data.address,
                  city: params.data.city,
                  postcode: params.data.postcode,
                  telesalesRep: params.data.assigned_to,
                }
              });
            }
          }}
          title="Go to Customer"
        >
          <OpenInNewIcon />
        </IconButton>
      </Box>
    )
  };
  const assignedColIndex = baseColDefs.findIndex(col => col.field === 'assigned_to');
  if (assignedColIndex !== -1) {
    baseColDefs[assignedColIndex] = {
      field: "assigned_to",
      headerName: "Assigned To",
      width: 130,
      valueGetter: (params) => params?.data?.assigned_to?.name || ''
    };
  }
  const createdAtColDef = {
    field: "createdAt",
    headerName: "Added At",
    width: 110,
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value);
      return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
    }
  };
  const stageColDef = {
    field: 'stage',
    headerName: "Stage",
    width: 130,
    valueGetter: (params) => params.data.opportunities?.[0]?.stage || "",
    cellRenderer: (params) => {
      const stage = params.value;
      let color = 'default';
      if (stage === "prospecting") color = "info";
      else if (stage === "not interested") color = "error";
      else if (stage === "qualified") color = "warning";
      else if (stage === "proposal") color = "primary";
      else if (stage === "negotiation") color = "secondary";
      else if (stage === "closed Win") color = "success";
      else if (stage === "closed Lost") color = "error";
      return stage ? (<Chip label={stage} color={color} size='small' sx={{ fontWeight: 500 }} />) : ("");
    }
  };
  const colDefsWithWidth = baseColDefs.map(colDef => {
    const fieldConfig = leadFields.find(f => f.field === colDef.field);
    return fieldConfig?.gridWidth ? { ...colDef, width: fieldConfig.gridWidth } : colDef;
  });
  const colDefs = [...colDefsWithWidth, createdAtColDef, stageColDef, actionColDef];
  const stageOptions = ['prospecting', 'not interested', 'qualified', 'proposal', 'negotiation', 'closed Win', 'closed Lost'];
  const leadSourceOptions = ['Website', 'Referral', 'Cold Call', 'Other'];
  const activityTypes = [
    { value: 'call', label: 'Call', icon: null },
    { value: 'email', label: 'Email', icon: null },
    { value: 'meeting', label: 'Meeting', icon: null },
    { value: 'note', label: 'Note', icon: null }
  ];
  return (
    <div style={{ height: "90%" }}>
      <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
      <Dialog open={dialogOpen} maxWidth="md" fullWidth scroll="paper" onClose={handleCloseDialog}>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <AddIcon color="primary" />
            <span>Create New Lead</span>
          </Box>
          <IconButton onClick={handleCloseDialog}><CloseIcon /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent dividers>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardHeader avatar={<PersonIcon color="primary" />} title="Contact Information" />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label="Customer Name" name="customer_name"
                          value={addFormValues.customer_name || ''} onChange={inputChangeListener} required
                          InputProps={{ startAdornment: <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} /> }} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label="Contact Name" name="contact_name"
                          value={addFormValues.contact_name || ''} onChange={inputChangeListener} required
                          InputProps={{ startAdornment: <PersonIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} /> }} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label="Phone" name="phone"
                          value={addFormValues.phone || ''} onChange={inputChangeListener}
                          InputProps={{ startAdornment: <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} /> }} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label="Email" name="email"
                          value={addFormValues.email || ''} onChange={inputChangeListener}
                          InputProps={{ startAdornment: <EmailIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} /> }} />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth size="small" label="Address" name="address"
                          value={addFormValues.address || ''} onChange={inputChangeListener}
                          InputProps={{ startAdornment: <LocationOnIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} /> }} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label="City" name="city"
                          value={addFormValues.city || ''} onChange={inputChangeListener}
                          InputProps={{ startAdornment: <LocationCityIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} /> }} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label="Postcode" name="postcode"
                          value={addFormValues.postcode || ''} onChange={inputChangeListener}
                          InputProps={{ startAdornment: <MarkunreadMailboxIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} /> }} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardHeader avatar={<FlagIcon color="primary" />} title="Lead Details" />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Lead Source</InputLabel>
                          <Select name="lead_source" value={addFormValues.lead_source || ''} onChange={inputChangeListener} label="Lead Source"
                            startAdornment={<SourceIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />}>
                            <MenuItem value=""><em>None</em></MenuItem>
                            {leadSourceOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Autocomplete
                          options={customers}
                          getOptionLabel={(option) => option.customer_name || option.contact_name || ''}
                          value={customers.find(c => c._id === addFormValues.customer) || null}
                          onChange={(e, newValue) => handleCustomerChange(e, newValue)}
                          isOptionEqualToValue={(option, value) => option._id === value?._id}
                          renderInput={(params) => <TextField {...params} label="Customer" size="small" placeholder="Search customer..." />}
                          loading={customers.length === 0}
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                  <Button variant="outlined" onClick={handleCloseDialog}>Cancel</Button>
                  <LoadingButton loading={sendingData} icon={<AddIcon />} disabled={sendingData} buttonLabel="ADD LEAD" />
                </Box>
              </Grid>
            </Grid>
          </form>
        </DialogContent>
      </Dialog>
      <CRMDialog
        open={crmDialogOpen}
        onClose={handleCloseCrmDialog}
        editMode={editMode}
        formValues={formValues}
        setFormValues={setFormValues}
        onSave={handleSaveCRM}
        onAddActivity={handleAddActivity}
        requiredWritePermissions={requiredWritePermissions}
        currentUserHasPermissions={currentUserHasPermissions}
        stageOptions={stageOptions}
        leadSourceOptions={leadSourceOptions}
        salesReps={salesReps}
        customers={customers}
        activityTypes={activityTypes}
        newActivityType={newActivityType}
        setNewActivityType={setNewActivityType}
        newActivitySubject={newActivitySubject}
        setNewActivitySubject={setNewActivitySubject}
        newActivityDescription={newActivityDescription}
        setNewActivityDescription={setNewActivityDescription}
        inputChangeListener={(e) => {
          const { name, value } = e.target;
          setFormValues(prev => ({ ...prev, [name]: value }));
        }}
        handleCloseDateChange={handleCloseDateChange}
        expectedCloseDate={formValues?.expected_close_date || formValues?.opportunities?.expected_close_date || null}
      />
      <Box sx={{ mb: 2, display: 'flex', gap: 2, justifyContent: 'space-between' }}></Box>
      <Box sx={{ height: '75vh' }}>
        <DataViewGrid rowData={rowData} columnDefs={colDefs} loading={sendingData} />
      </Box>
    </div>
  );
};