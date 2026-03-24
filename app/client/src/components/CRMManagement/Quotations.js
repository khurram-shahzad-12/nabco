import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, TextField, Autocomplete, IconButton } from '@mui/material';
import displaySnackState from '../customisedSnackBar/DisplaySnackState';
import CustomisedSnackBar from '../customisedSnackBar/CustomisedSnackBar';
import DataViewGrid from '../DataViewGrid/DataViewGrid';
import { defaultSnackState, fetchAllEntriesAndSetRowData, getColumnDefs, fetchDropdownField, handleDeleteEntry, getAndOpenReportsInNewTab, } from '../formFunctions/FormFunctions';
import { Edit, Delete, Print } from '@mui/icons-material';
import CreateQuotationForm from './CreateQuotationForm';

const Quotations = () => {
  const [sendingData, setSendingData] = useState(false);
  const [snackState, setSnackState] = useState(defaultSnackState);
  const [rowData, setRowData] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [vatData, setVatData] = useState({ loaded: false, map: {} });
  const [customersList, setCustomersList] = useState({ loaded: false, map: {} });
  const [leadsList, setLeadsList] = useState({ loaded: false, map: {} });
  const [selectedQuotationIds, setSelectedQuotationIds] = useState([]);
  const [quotationList, setQuotationList] = useState([]);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const API_NAME = '/inventory';
  const API_VAT = '/vat';
  const API_CUSTOMER = '/customer';
  const API_LEADS = '/lead/getOnlyleads';
  const API_QUOTATION = '/quotation';

  const fetchAllQuotations = () => {
    fetchAllEntriesAndSetRowData(API_QUOTATION, null, setSendingData, setQuotationList, setSnackState);
  };
  const fetchAllItems = () => {
    fetchAllEntriesAndSetRowData(API_NAME, null, setSendingData, setRowData, setSnackState);
    fetchVat();
    fetchCustomers();
  };
  const fetchVat = () => {
    fetchDropdownField(API_VAT, setVatData, setSnackState, false);
  };
  const fetchCustomers = () => {
    fetchDropdownField(API_CUSTOMER, setCustomersList, setSnackState, false);
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Quotation?')) return;
    handleDeleteEntry(API_QUOTATION, id, setSendingData, setSnackState, fetchAllQuotations)
  };
  const fetchLeads = () => {
    fetchDropdownField(API_LEADS, setLeadsList, setSnackState, false, (data) => {
      return data.map(lead => ({
        ...lead,
        displayName: lead.customer_name || lead.contact_name || 'Unnamed Lead'
      }));
    });
  };

  useEffect(() => { fetchLeads(); fetchAllQuotations(); fetchAllItems() }, []);
    const onSelectionChanged = (event) => {
    const selectedNodes = event.api.getSelectedNodes();
    const ids = selectedNodes.map(node => node.data._id);
    setSelectedQuotationIds(ids);
  };
  const handleOpenDialog = () => {
    setDialogOpen(true);
    setEditingQuotation(null);
  };
  const handleCloseDialog = () => {
    setDialogOpen(false); fetchAllQuotations(); setEditingQuotation(null);
  };
  const handleRefresh = () => {
    setSelectedCustomer(null);
    setSelectedLead(null);
    if(gridApi) {gridApi.deselectAll(); gridApi.refreshCells({ force: true });}
    setSelectedQuotationIds(null);
  };
  const checkboxColumnDef = {
    headerName: '',
    checkboxSelection: true,
    headerCheckboxSelection: true,
    headerCheckboxSelectionFilteredOnly: true,
    filter: false,
    minWidth: 60,
    maxWidth: 60,
  };

 const handleEdit = (quotation) => {
  setEditingQuotation(quotation);
  setDialogOpen(true);
 }
  const ActionCellRenderer = (params) => (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <IconButton
        color="primary"
        size="small"
      onClick={(e) => { handleEdit(params.data); }}
      >
        <Edit />
      </IconButton>
      <IconButton
        color="error"
        size="small"
        onClick={(e) => { handleDelete(params.data._id); }}
      >
        <Delete />
      </IconButton>
    </Box>
  );
  const colFields = [
    {headerName: "Quotation No", field: "quotationNo", widht: 50},
    { headerName: "Customer Name", field: "customerInfo.customer_name", width: 250 },
    { headerName: "Phone", field: "customerInfo.phone", width: 150 },
    { headerName: "Total (Excl VAT)", field: "total_no_vat", width: 150 },
    { headerName: "VAT", field: "vat_total", width: 120 },
    { headerName: "Total (Incl VAT)", field: "total_incl_vat", width: 160 },
    { headerName: "Created Date", field: "createdAt", width: 180, valueFormatter: (params) => new Date(params.value).toLocaleDateString() },
    { headerName: "Actions", field: "id", width: 120, cellRenderer: ActionCellRenderer, sortable: false, filter: false }
  ];
  const columnDefs = [checkboxColumnDef, ...colFields];
  const productsMap = {};
  rowData.forEach((item) => {
    productsMap[item._id] = item;
  });
  const activeCustomers = Object.values(customersList.map || {}).filter(
    (cust) => cust.active && !cust.on_hold
  );
  const leadOptions = Object.values(leadsList.map || {});
   const printSelectedQuotations = async () => {
    if (selectedQuotationIds.length === 0) { displaySnackState('No quotations selected', 'warning', setSnackState); return;}
    const payload = {ids: selectedQuotationIds}
    getAndOpenReportsInNewTab(payload, "quotation", "printSelected.pdf", setSnackState);
  };
  return (
    <div style={{ height: '90%' }}>
      <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <Autocomplete
          options={activeCustomers}
          getOptionLabel={(option) => option.customer_name || ''}
          value={selectedCustomer}
          onChange={(e, newValue) => {
            setSelectedCustomer(newValue);
            setSelectedLead(null);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Customer"
              variant="outlined"
              size="small"
              sx={{ width: 300 }}
            />
          )}
          disabled={customersList.loaded === false}
        />
        <Autocomplete
          options={leadOptions}
          getOptionLabel={(option) => option.customer_name || ''}
          value={selectedLead}
          onChange={(e, newValue) => {
            setSelectedLead(newValue);
            setSelectedCustomer(null);
          }}
          renderInput={(params) => (
            <TextField
            {...params}
            label="Select Lead"
            variant="outlined"
            size="small"
            sx={{ width: 300 }}
            />
          )}
          disabled={leadsList.loaded === false}
        />

        <Button
          variant="contained"
          onClick={handleOpenDialog}
          disabled={selectedCustomer === null && selectedLead === null}
        >
          Create Quotation
        </Button>
        <Button
          variant="contained"
          startIcon={<Print />}
          onClick={printSelectedQuotations}
          disabled={!selectedQuotationIds || selectedQuotationIds?.length === 0 || sendingData}
        >
          Print Selected ({selectedQuotationIds?.length})
        </Button>
          <Button onClick={handleRefresh} variant='contained'>Reload</Button>
      </Box>
      <Box sx={{ height: '75vh' }}>
        <DataViewGrid 
        rowData={quotationList} 
        columnDefs={columnDefs} 
        loading={sendingData} 
        agGridProps={{rowSelection: 'multiple',suppressRowClickSelection: true, onSelectionChanged: onSelectionChanged, onGridReady: (params) => setGridApi(params.api)}}
        />
      </Box>
      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullScreen>
        <CreateQuotationForm
          productsMap={productsMap}
          vatData={vatData}
          onClose={handleCloseDialog}
          postSubmitCallback={fetchAllQuotations}
          initialCustomer={selectedCustomer}
          initialLead={selectedLead}
          editQuotation={editingQuotation}
          customerList={customersList}
          fetchAllQuotations={fetchAllQuotations}
        />
      </Dialog>
    </div>
  );
};
export default Quotations;