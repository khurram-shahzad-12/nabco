import React, { useState, useEffect } from 'react';
import { DialogTitle, DialogContent, DialogActions, Button, Grid, TextField, Card, CardContent, Backdrop, CircularProgress, IconButton } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import axiosDefault from '../axiosDefault/axiosDefault';
import AddIcon from '@mui/icons-material/Add';
import displaySnackState from '../customisedSnackBar/DisplaySnackState';
import CustomisedSnackBar from '../customisedSnackBar/CustomisedSnackBar';
import { ItemDropdownChooser } from '../InvoiceForm/ItemDropdownChooser';
import { defaultInvoiceItemEntry, getAndOpenReportsInNewTab, handleDataEditSubmit, handleDataSubmit, } from '../formFunctions/FormFunctions';
import { URL_API, URL_ROOT } from '../../configs/config';
import CloseIcon from '@mui/icons-material/Close';

const CreateQuotationForm = ({ productsMap, vatData, onClose, initialCustomer = null, initialLead = null, editQuotation = null, customerList = { loaded: false, map: {} }, fetchAllQuotations }) => {
    const [sending, setSending] = useState(false);
    const [snackState, setSnackState] = useState({ open: false, message: '', severity: 'info' });
    const [selectedCustomer, setSelectedCustomer] = useState(initialCustomer);
    const [items, setItems] = useState([]);
    const [customerItems, setCustomerItems] = useState(null);
    const [totals, setTotals] = useState({ total_no_vat: 0, vat_total: 0, total_incl_vat: 0 });
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedLead, setSelectedLead] = useState(null);
    const [sendingData, setSendingData] = useState(false);
    const axios = axiosDefault();

    useEffect(() => {
        if (editQuotation) {
            if (editQuotation.customer && customerList.loaded) {
                const cust = customerList.map[editQuotation.customer];
                setSelectedCustomer(cust || null);
            } else {
                setSelectedCustomer(null);
            }
            if (editQuotation.lead) {
                setSelectedLead({
                    _id: editQuotation.lead,
                    customer_name: editQuotation.customerInfo?.customer_name || '',
                    phone: editQuotation.customerInfo?.phone || ''
                });
            } else {
                setSelectedLead(null);
            }
            if (editQuotation.items && Array.isArray(editQuotation.items)) {

                const initialItems = editQuotation.items.map(item => ({
                    _id: item.productId,
                    quantity: item.quantity,
                    rate: item.rate ?? 0,
                    tax: item.tax,
                    name: item.name,
                    vat: item.vat,
                    default_sale_price: item.default_sale_price,
                    key: uuidv4(),
                }));
                setItems(initialItems);
            } else {
                setItems([{ ...defaultInvoiceItemEntry(), key: uuidv4() }]);
            }
        } else {
            setSelectedCustomer(initialCustomer);
            setSelectedLead(initialLead);
            const emptyRows = Array.from({ length: 10 }, () => ({
                ...defaultInvoiceItemEntry(),
                key: uuidv4()
            }));
            setItems(emptyRows);
        }
    }, [editQuotation, customerList.loaded, initialCustomer, initialLead]);

    useEffect(() => {
        if (selectedCustomer) {
            fetchCustomerItems(selectedCustomer._id, false);
        } else { setCustomerItems(null); }
    }, [selectedCustomer]);

    const fetchCustomerItems = (customerId, applyPrices = false) => {
        setSending(true);
        axios.get(`${URL_ROOT}${URL_API}/customerItems/${customerId}`)
            .then((res) => {
                setCustomerItems(res.data);
                if (applyPrices && res.data?.items) {
                    const priceMap = {};
                    res.data.items.forEach((ci) => { priceMap[ci._id] = ci.rate; });
                    setItems((prev) =>
                        prev.map((item) => {
                            if (!item._id) return item;
                            const custPrice = priceMap[item._id];
                            if (custPrice !== undefined) {
                                return { ...item, rate: custPrice, };
                            } else {
                                const product = productsMap[item._id];
                                const defaultRate = product?.default_sale_price ?? 0;
                                return { ...item, rate: defaultRate };
                            }
                        })
                    );
                }
                setRefreshKey((prev) => prev + 1);
                setSending(false);
            })
            .catch((error) => {
                console.error(error);
                displaySnackState(`Failed to fetch customer items: ${error.response?.data || error.message}`, 'error', setSnackState);
                setSending(false);
            });
    };

    useEffect(() => {
        let totalNoVat = 0,
            vatTotal = 0,
            totalInclVat = 0;
        items.forEach((item) => {
            if (item._id && item.quantity > 0) {
                const qty = Number(item.quantity);
                const rate = Number(item.rate);
                const taxRate = Number(item.tax) || 0;
                totalNoVat += qty * rate;
                vatTotal += qty * rate * (taxRate / 100);
                totalInclVat += qty * rate * (1 + taxRate / 100);
            }
        });
        setTotals({
            total_no_vat: Number(totalNoVat.toFixed(2)),
            vat_total: Number(vatTotal.toFixed(2)),
            total_incl_vat: Number(totalInclVat.toFixed(2)),
        });
    }, [items]);

    const handleUpdateCustomerItemPrices = async (customerId) => {
        const validItems = items.filter(item => item._id).map(item => ({ _id: item._id, rate: item.rate }))
        if (validItems.length === 0) { displaySnackState("no items to update", 'warning', setSnackState); return; }
        try {
            const resp = await axios.put(`${URL_ROOT}${URL_API}/customerItems/upsertCustomerItems/${customerId}`, { items: validItems });
            if (resp.status === 200) { displaySnackState('Customer item prices updated successfully', 'success', setSnackState) }
        } catch (error) {
            console.log(error);
            displaySnackState(`Failed to update prices: ${error.response?.data?.message || error.message}`, 'error', setSnackState)
        }
    }
    const handleUpdateCustomerItems = () => { if (selectedCustomer) { fetchCustomerItems(selectedCustomer._id, true); } };
    const handleAddMore = () => { setItems([...items, { ...defaultInvoiceItemEntry(), key: uuidv4() }]); };
    const handleSubmit = (e) => {
        e.preventDefault();
        const filteredItems = items.filter((item) => item._id && item.quantity > 0);
        if (filteredItems.length === 0) { displaySnackState('Please add at least one item with quantity > 0', 'warning', setSnackState); return; }
        if (!selectedCustomer && !selectedLead) { displaySnackState('Please select customer to crete a quotation', 'warning', setSnackState); return; }
        let customer_name;
        let phone;
        if (selectedCustomer) { customer_name = selectedCustomer.customer_name || ''; phone = selectedCustomer.phone || '' }
        else { customer_name = selectedLead.customer_name || ''; phone = selectedLead.phone || '' }
        const payload = {
            customer: selectedCustomer ? selectedCustomer._id : null,
            lead: selectedLead?._id || null,
            customerInfo: {
                customer_name: customer_name,
                phone: phone,
            },
            items: filteredItems.map(({ _id, quantity, rate, tax, name, vat, default_sale_price }) => ({ productId: _id, quantity, rate, tax, name, vat, default_sale_price })),
            total_no_vat: totals.total_no_vat,
            vat_total: totals.vat_total,
            total_incl_vat: totals.total_incl_vat,
        };
        if (editQuotation) {
            const editPayload = { _id: editQuotation._id, ...payload };
            handleDataEditSubmit('/quotation', null, setSendingData, () => { displaySnackState("updated successfully", "success", setSnackState); }, editPayload, () => { }, null, setSnackState, fetchAllQuotations);
        } else {
            handleDataSubmit('/quotation', null, setSendingData, payload, () => { }, null, setSnackState, fetchAllQuotations);
        }
        getAndOpenReportsInNewTab(payload, "quotation", "createQuotation.pdf", setSnackState);
        onClose();
        setSending(false);
    };
    return (
        <>
            <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={sending}>
                <CircularProgress color="inherit" />
            </Backdrop>
            <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
            <DialogTitle sx={{ m: 0, p: 2, position: 'relative' }}>Create Quotation from Selected Items
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500], }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <ItemDropdownChooser
                                    key={refreshKey}
                                    productsList={{ map: productsMap, loaded: true }}
                                    vatData={vatData}
                                    itemsList={items}
                                    setItems={setItems}
                                    currentCustomer={selectedCustomer}
                                    customerItems={customerItems}
                                    updateCustomerItems={handleUpdateCustomerItems}
                                    setSendingData={setSending}
                                    canEdit={true}
                                    itemsAudit={{}}
                                    setItemsAudit={() => { }}
                                    quotation
                                    selectedLead={selectedLead ? true : false}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12}>
                        <Button variant="outlined" onClick={handleAddMore} startIcon={<AddIcon />}>
                            Add More Rows
                        </Button>
                    </Grid>
                    <Grid item xs={12} container spacing={2} justifyContent="flex-end">
                        <Grid item xs={12} sm={4} md={3}>
                            <TextField
                                label="Total (excl VAT)"
                                value={`£${totals.total_no_vat.toFixed(2)}`}
                                InputProps={{ readOnly: true }}
                                fullWidth
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4} md={3}>
                            <TextField
                                label="VAT Total"
                                value={`£${totals.vat_total.toFixed(2)}`}
                                InputProps={{ readOnly: true }}
                                fullWidth
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4} md={3}>
                            <TextField
                                label="Total (incl VAT)"
                                value={`£${totals.total_incl_vat.toFixed(2)}`}
                                InputProps={{ readOnly: true }}
                                fullWidth
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                {selectedCustomer && (<Button
                    onClick={() => handleUpdateCustomerItemPrices(selectedCustomer._id)}
                    variant="contained"
                    disabled={sending}
                >
                    Update Customer Item Prices
                </Button>)}
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={sending}
                >
                    {editQuotation ? 'Update Quotation' : 'Create Quotation'}  (PDF)
                </Button>
            </DialogActions>
        </>
    );
};

export default CreateQuotationForm;