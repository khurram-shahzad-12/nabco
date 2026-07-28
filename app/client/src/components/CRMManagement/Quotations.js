import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, TextField, Autocomplete, IconButton } from '@mui/material';
import displaySnackState from '../customisedSnackBar/DisplaySnackState';
import CustomisedSnackBar from '../customisedSnackBar/CustomisedSnackBar';
import DataViewGrid from '../DataViewGrid/DataViewGrid';
import { defaultSnackState, fetchAllEntriesAndSetRowData, getColumnDefs, fetchDropdownField, handleDeleteEntry, getAndOpenReportsInNewTab, } from '../formFunctions/FormFunctions';
import CreateQuotationForm from './CreateQuotationForm';
import { Edit, Delete, Print, Receipt, Visibility } from '@mui/icons-material';
import axiosDefault from '../axiosDefault/axiosDefault';
import { URL_API, URL_ROOT } from '../../configs/config';
import { useAuth0 } from '@auth0/auth0-react';
import moment from 'moment';

const Quotations = () => {
  const { user } = useAuth0();
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
  const [convertingQuotationId, setConvertingQuotationId] = useState(null);
  const API_NAME = '/inventory';
  const API_VAT = '/vat';
  const API_CUSTOMER = '/customer';
  const API_LEADS = '/lead/getOnlyleads';
  const API_QUOTATION = '/quotation';
  const axios = axiosDefault();

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
  const handleConverttoInvoice = async (quotationId) => {
    const quotation = quotationList.find(q => q._id === quotationId);
    if (!quotation) { 
      displaySnackState('Quotation not found', 'error', setSnackState); 
      return; 
    }
    
    if (quotation.convertedToInvoice) { 
      displaySnackState('This quotation has already been converted to an invoice', 'warning', setSnackState); 
      return; 
    }
    
    setConvertingQuotationId(quotationId);
    setSendingData(true);
    
    try {
      let customerId = quotation.customer;
      
      // If no customer ID, try to find customer by name
      if (!customerId) {
        const customerName = quotation.customerInfo?.customer_name;
        if (!customerName) {
          displaySnackState('No customer information found in quotation', 'error', setSnackState);
          return;
        }
        
        // Search for existing customer by name
        const existingCustomer = Object.values(customersList.map || {}).find(
          cust => cust.customer_name?.toLowerCase() === customerName.toLowerCase()
        );
        
        if (existingCustomer) {
          customerId = existingCustomer._id;
          // Update quotation with the found customer ID
          await axios.put(`${URL_ROOT}${URL_API}/quotation/${quotation._id}`, { 
            customer: customerId, 
            lead: null 
          });
        } else {
          displaySnackState(
            `Customer "${customerName}" not found in customer list. Please register lead "${customerName}" as a customer first.`,
            "error", 
            setSnackState
          ); 
          return;
        }
      }
      
      // Simplified payload for the conversion endpoint
      const payload = {
        quotationId: quotation._id,
        customerId: customerId,
        createdBy: user?.name || 'system'
      };

      // Call the conversion API
      const response = await axios.post(`${URL_ROOT}${URL_API}/quotation/converttoinvoice`, payload);
      
      if (response.status === 200 || response.status === 201) {
        const result = response.data;
        
        displaySnackState(
          `Successfully converted quotation to Invoice #${result.invoiceNumber || result.invoice?.sale_number || ''}`,
          'success', 
          setSnackState
        );
        
        // Refresh the quotations list
        fetchAllQuotations();
      } else {
        displaySnackState('Failed to convert quotation to invoice', 'error', setSnackState);
      }
    } catch (error) {
      console.error('Error converting quotation to invoice:', error);
      
      // Handle specific error messages from backend
      const errorMessage = error.response?.data?.message || error.message;
      displaySnackState(`Conversion failed: ${errorMessage}`, 'error', setSnackState);
    } finally {
      setConvertingQuotationId(null);
      setSendingData(false);
    }
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
    if (gridApi) { gridApi.deselectAll(); gridApi.refreshCells({ force: true }); }
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
  // const ActionCellRenderer = (params) => (
  //   <Box sx={{ display: 'flex', gap: 1 }}>
  //     <IconButton
  //       color="primary"
  //       size="small"
  //       onClick={(e) => { handleEdit(params.data); }}
  //     >
  //       <Edit />
  //     </IconButton>
  //     <IconButton
  //       color="error"
  //       size="small"
  //       onClick={(e) => { handleDelete(params.data._id); }}
  //     >
  //       <Delete />
  //     </IconButton>
  //   </Box>
  // );
  const ActionCellRenderer = (params) => {
    const isConverting = convertingQuotationId === params.data._id;
    
    // Check if quotation can be converted
    const canConvert = params.data.customerInfo && 
                      params.data.customerInfo.customer_name && 
                      !params.data.convertedToInvoice;

    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <IconButton
          color="primary"
          size="small"
          onClick={() => handleEdit(params.data)}
          title="Edit Quotation"
        >
          <Edit />
        </IconButton>
        <IconButton
          color="error"
          size="small"
          onClick={() => handleDelete(params.data._id)}
          title="Delete Quotation"
        >
          <Delete />
        </IconButton>
        {canConvert && (
          <IconButton
            color="success"
            size="small"
            onClick={() => handleConverttoInvoice(params.data._id)}
            disabled={isConverting || sendingData}
            title="Convert to Invoice"
          >
            <Receipt />
          </IconButton>
        )}
        {params.data.convertedToInvoice && params.data.invoiceId && (
          <IconButton
            color="info"
            size="small"
            onClick={() => window.open(`/invoice/${params.data.invoiceId}`, '_blank')}
            title="View Invoice"
          >
            <Visibility />
          </IconButton>
        )}
      </Box>
    );
  };
  const colFields = [
    { headerName: "Quotation No", field: "quotationNo", widht: 50 },
    { headerName: "Customer Name", field: "customerInfo.customer_name", width: 250 },
    { headerName: "Phone", field: "customerInfo.phone", width: 150 },
    { headerName: "Total (Excl VAT)", field: "total_no_vat", width: 150 },
    { headerName: "VAT", field: "vat_total", width: 120 },
    { headerName: "Total (Incl VAT)", field: "total_incl_vat", width: 160 },
    { headerName: "Created Date", field: "createdAt", width: 180, valueFormatter: (params) => new Date(params.value).toLocaleDateString("en-GB") },
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
    if (selectedQuotationIds.length === 0) { displaySnackState('No quotations selected', 'warning', setSnackState); return; }
    const payload = { ids: selectedQuotationIds }
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
          agGridProps={{ rowSelection: 'multiple', suppressRowClickSelection: true, onSelectionChanged: onSelectionChanged, onGridReady: (params) => setGridApi(params.api) }}
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