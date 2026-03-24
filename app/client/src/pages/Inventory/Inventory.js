import React, {useEffect, useState} from 'react';

import displaySnackState from "../../components/customisedSnackBar/DisplaySnackState";
import CustomisedSnackBar from "../../components/customisedSnackBar/CustomisedSnackBar";
import {LoadingButton} from "../../components/loadingButton/LoadingButton";
import {
    defaultLoadedFieldData, defaultSnackState,
    fetchAllEntriesAndSetRowData,
    fetchDropdownField,
    getActionColumnDef, getColumnDefs,
    getDefaultFormFields, getGridFormInputFields,
    getInputFields,
    handleCheckboxChange,
    handleDataEditSubmit,
    handleDataSubmit,
    handleInputChange, handleNumberInputChange,
    currentUserHasPermissions, stringValueToNumberComparator, getItemReportsInNewTab, fetchEntries
} from "../../components/formFunctions/FormFunctions";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import {Button, Dialog} from "@mui/material";

import LinkedFieldCellValueGetterRenderer from "../../components/cellRenderers/LinkedFieldCellValueGetterRenderer";
import {listChipsCellRenderer} from "../../components/cellRenderers/ListChipsCellRenderer";
import DataViewGrid from "../../components/DataViewGrid/DataViewGrid";
import DialogClosingTitleBar from "../../components/DialogClosingTitleBar/DialogClosingTitleBar";
import cardStyles from "../../components/PopupCardDialogStyles/PopupCardDialogStyles.module.css";
import BooleanFieldCellRenderer from "../../components/cellRenderers/BooleanFieldCellRenderer";
import {PriceCellRenderer} from "../../components/cellRenderers/PriceCellRenderer";
import {tagsFilter} from "../../components/agGridFilters/tagsFilter";
import axiosDefault from "../../components/axiosDefault/axiosDefault";
import {URL_API, URL_ROOT} from "../../configs/config";
import ImageViewDialog from "../../components/ImageViewDialog/ImageViewDialog";
import InventoryAlertModal from "../../components/InventoryAlertModal/InventoryAlertModal";
import _ from "lodash";
import CustomerPriceBelowCostModal from "../../components/CustomerPriceBelowCostModal/CustomerPriceBelowCostModal";
import CustomConfirmModal from "../../components/CustomConfirmModal/CustomConfirmModal";

const API_NAME = '/inventory';

export const Inventory = () => {
    const [sendingData, setSendingData] = useState(false);
    const [inventoryAlertModalOpen, setInventoryAlertModalOpen] = useState(false);
    const [customerPricesBelowCostModalOpen, setCustomerPricesBelowCostModalOpen] = useState(false);
    const [customerPricesBelowCostData, setCustomerPricesBelowCostData] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState({open: false});
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [imageDialogID, setImageDialogID] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editModeOriginalDataCopy, setEditModeOriginalDataCopy] = useState({});
    const [selectedItems, setSelectedItems] = useState([]);
    const [categoriesData, setCategoriesData] = useState(defaultLoadedFieldData);
    const [vatData, setVatData] = useState(defaultLoadedFieldData);
    const [tagsData, setTagsData] = useState(defaultLoadedFieldData);
    const [suppliersData, setSuppliersData] = useState(defaultLoadedFieldData);
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [rowData, setRowData] = useState([]);
    const [gridApi, setGridApi] = useState(null);
    const requiredWritePermissions = [process.env.REACT_APP_WRITE_INVENTORY_CLAIM];
    const requiredDeletePermissions = [process.env.REACT_APP_DELETE_INVENTORY_ITEMS];
    const requiredInventoryAlertPermissions = [process.env.REACT_APP_WRITE_INVENTORY_ALERT_QUANTITY];
    const requiredResetNegativesPermissions = [process.env.REACT_APP_RESET_NEGATIVE_INVENTORY_ITEMS];
    const requiredShowStockValuePermissions = [process.env.REACT_APP_SHOW_VALUE_INVENTORY_ITEMS];
    const requiredCSVPermission = [process.env.REACT_APP_CUSTOMER_ACCOUNTS_CSV_PERMISSION];

    const disableEditMode = () => {
        setFormValues(defaultFormState);
        setEditMode(false);
    };

    const inputChangeListener = event => {
        handleInputChange(event, formValues, setFormValues)
    };

    const checkboxChangeListener = (event) => {
        handleCheckboxChange(event, formValues, setFormValues);
    };

    const tagsChangeListener = (event, value) => {
        event.target = {
            value: value,
            name: "tags"
        }
        handleInputChange(event, formValues, setFormValues);
    }

    const fetchAllItems = () => {
        fetchAllEntriesAndSetRowData(API_NAME, null, setSendingData, setRowData, setSnackState);
        fetchVat();
        fetchCategories();
        fetchTags();
        fetchSuppliers()
    };

    const fetchVat = () => {
        fetchDropdownField("/vat", setVatData, setSnackState, false);
    };

    const fetchCategories = () => {
        fetchDropdownField("/inventory-category", setCategoriesData, setSnackState, false);
    };

    const fetchTags = () => {
        fetchDropdownField("/inventory-tag", setTagsData, setSnackState, true);
    };

    const fetchSuppliers = () => {
        fetchDropdownField("/inventory-supplier", setSuppliersData, setSnackState, false);
    };

    const handleSubmit = event => {
        handleDataSubmit(API_NAME, event, setSendingData, formValues, setFormValues, defaultFormState, setSnackState, fetchAllItems);
    };

    const handleEditSubmit = event => {
        event.preventDefault();
        if(editModeOriginalDataCopy.cost_price !== formValues.cost_price ||
            editModeOriginalDataCopy.min_sale_price !== formValues.min_sale_price ||
            editModeOriginalDataCopy.default_sale_price !== formValues.default_sale_price
        ) {
            setConfirmDialogOpen({
                open: true,
                callbacks: {
                    yes: () => submitEditData(event, true),
                    no: () => submitEditData(event, false),
                    cancel: () => setConfirmDialogOpen({open: false})
                }
            });
        } else {
            submitEditData(event, false);
        }
    };

    const submitEditData = (event, shouldUpdateCustomerPrices) => {
        const postSuccessEditSubmissionDisabledEditModeAndUpdateInvoices = () => {
            setEditMode(false);
            setConfirmDialogOpen({open: false});
            /*const originalItemData = rowData.find(item => item._id === formValues._id);
            if(
                originalItemData.cost_price !== formValues.cost_price ||
                originalItemData.min_sale_price !== formValues.min_sale_price ||
                originalItemData.default_sale_price !== formValues.default_sale_price ||
                originalItemData.vat !== formValues.vat
            ) {
                axiosDefault().post(URL_ROOT + URL_API + "/invoice/updateInvoiceItemPrices", {...formValues, tax: vatData.map[formValues.vat].rate})
                    .catch(error => {
                        console.error(error);
                        displaySnackState(`Failed to update invoices - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
                    })
            }*/
            const originalItemData = rowData.find(item => item._id === formValues._id);
            if(
                originalItemData.weight_grams !== formValues.weight_grams ||
                originalItemData.weight_kg !== formValues.weight_kg
            ) {
                axiosDefault().post(URL_ROOT + URL_API + "/invoice/updateInvoicesAfterWeightChange", formValues)
                    .catch(error => {
                        console.error(error);
                        displaySnackState(`Failed to update invoice weights - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
                    })
            }
        };
        if(shouldUpdateCustomerPrices) {
            let newPayload = _.cloneDeep(formValues);
            newPayload.updateCustomerPrices = shouldUpdateCustomerPrices;
            handleDataEditSubmit(API_NAME, event, setSendingData, postSuccessEditSubmissionDisabledEditModeAndUpdateInvoices,
                newPayload, setFormValues, defaultFormState, setSnackState, fetchAllItems);
        } else {
            handleDataEditSubmit(API_NAME, event, setSendingData, postSuccessEditSubmissionDisabledEditModeAndUpdateInvoices,
                formValues, setFormValues, defaultFormState, setSnackState, fetchAllItems);
        }
    };

    const handleOpenDialog = () => {
        setDialogOpen(true);
    };

    const rowSelectionChanged = event => {
        setSelectedItems(event.api.getSelectedNodes().map(node => node.data._id));
    };

    const filterChangedHandler = event => {
        if(event.api.getSelectedNodes().length > 0) {
            event.api.deselectAll();
        }
    };

    const openItemsListPDF = (api) => {
        getItemReportsInNewTab(selectedItems, api, setSnackState);
    };

    const openItemsInStockPDF = (api) => {
        getItemReportsInNewTab([], api, setSnackState);
    };

    const showStockValue = () => {
        const value = rowData.reduce((accumulator, currentItem) => accumulator + (currentItem.cost_price * currentItem.quantity), 0);
        alert(`Total stock value: £${value.toFixed(2)}`);
    };

    const resetNegativeInventory = () => {
        if(!window.confirm("Are you sure you want to reset all negative quantity items to 0?"))
            return;
        setSendingData(true);
        axiosDefault().get(URL_ROOT + URL_API + API_NAME + '/admin/resetNegativeQuantities')
            .then(response => {

            })
            .catch(error => {
                console.error(error);
                displaySnackState(`Failed to rest quantities - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
            })
            .finally(() => {
                fetchAllItems();
            })
    };

    const handleRemoveImage = event => {
        event.preventDefault();
        if(window.confirm("Are you sure you want to remove this image?")) {
            axiosDefault().delete(URL_ROOT + URL_API + API_NAME + '/removeInventoryImage/' + formValues._id)
                .then(response => {
                    displaySnackState("Image deleted successfully", "success", setSnackState);
                })
                .catch(error => {
                    console.error(error);
                    displaySnackState(`Failed to delete image - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
                })
        }
    };

    const handleUploadImage = event => {
        event.preventDefault();
        const formData = new FormData();
        formData.append("image", event.target.files[0]);
        axiosDefault().post(URL_ROOT + URL_API + API_NAME + '/updateInventoryImage/' + formValues._id, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(response => {
                displaySnackState("Image saved successfully", "success", setSnackState);
            })
            .catch(error => {
                console.error(error);
                displaySnackState(`Failed to upload image - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
            })
    }

    const handleCloseDialog = () => {
        setEditMode(false);
        setDialogOpen(false);
        setFormValues(defaultFormState);
    };

    const handleCloseImageDialog = () => {
        setImageDialogOpen(false);
    };

    const showImageFunction = id => {
        setImageDialogID(id);
        setImageDialogOpen(true);
    };

    const getItemsAtAlertLevel = () => {
        return rowData.filter(item => item.quantity <= item.alert_quantity);
    };

    const showCustomersWithPriceBelowCost = () => {
        const success = (res) => {
            setCustomerPricesBelowCostData(res.data);
            setCustomerPricesBelowCostModalOpen(true);
        };
        const fail = (error) => {
            console.error(error);
            displaySnackState(`Failed to get customer prices - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
        };
        fetchEntries("/customerItems/getCustomersWithPriceBelowCost", success, fail);
    };

    const csvAction = event => {
        const params = {
            fileName: "inventory_export.csv",
            columnKeys: ["name", "category", "min_sale_price", "default_sale_price"],
            suppressQuotes: true
        }
        if(!gridApi) {
            alert("Grid API not ready, please wait before trying again");
        } else {
            const resCSV = gridApi.api.exportDataAsCsv(params);
        }
    };

    const itemData = [
        {
            field: "name",
            label: "Item Name",
            type: "textfield",
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true,
                type: "text",
                autoFocus: true
            }
        },
        {
            field: "category",
            label: "Category",
            type: "dropdown",
            dropdownOptions: categoriesData,
            defaultState: [],
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true,
                type: "text"
            },
            gridProps: {
                width: 150,
                valueGetter: props => LinkedFieldCellValueGetterRenderer({
                    ...props,
                    idMapping: categoriesData.map,
                    mappedFieldName: "name",
                    mappingDataLoaded: categoriesData.loaded
                })
            }
        },
        {
            field: "quantity",
            label: "Quantity",
            type: "textfield",
            defaultState: 0,
            changeListener: event => handleNumberInputChange(event, formValues, setFormValues),
            textFieldProps: {
                type: "number",
                inputProps: {
                    step: 1
                }
            },
            gridProps: {
                type: "rightAligned"
            }
        },
        ... currentUserHasPermissions([process.env.REACT_APP_WRITE_INVENTORY_ALERT_QUANTITY]) ? [{
            field: "alert_quantity",
            label: "Low Stock Alert Quantity",
            type: "textfield",
            defaultState: 0,
            changeListener: event => handleNumberInputChange(event, formValues, setFormValues),
            textFieldProps: {
                type: "number",
                inputProps: {
                    step: 1
                }
            },
            gridProps: {
                type: "rightAligned"
            }
        }] : [],
        {
            field: "vat",
            label: "Vat",
            type: "dropdown",
            dropdownOptions: vatData,
            defaultState: [],
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true,
                type: "text"
            },
            gridProps: {
                width: 120,
                valueGetter: props => LinkedFieldCellValueGetterRenderer({
                    ...props,
                    idMapping: vatData.map,
                    mappedFieldName: "name",
                    mappingDataLoaded: vatData.loaded
                })
            }
        },
        {
            field: "active",
            label: "Active",
            type: "checkbox",
            defaultState: true,
            changeListener: checkboxChangeListener,
            gridProps: {
                cellRenderer: BooleanFieldCellRenderer
            }
        },
            ... currentUserHasPermissions([process.env.REACT_APP_WRITE_INVENTORY_CLAIM]) ? [{
            field: "cost_price",
            label: "Cost Price",
            type: "textfield",
            changeListener: event => handleNumberInputChange(event, formValues, setFormValues),
            textFieldProps: {
                required: true,
                type: "number",
                inputProps: {
                    step: 0.01
                }
            },
            gridProps: {
                width: 120,
                type: "rightAligned",
                valueGetter: PriceCellRenderer,
                comparator: stringValueToNumberComparator
            }
        }] : [],
        {
            field: "min_sale_price",
            label: "Min Sale Price",
            type: "textfield",
            changeListener: event => handleNumberInputChange(event, formValues, setFormValues),
            textFieldProps: {
                required: true,
                type: "number",
                inputProps: {
                    step: 0.01
                }
            },
            gridProps: {
                width: 150,
                type: "rightAligned",
                valueGetter: PriceCellRenderer,
                comparator: stringValueToNumberComparator
            }
        },
        {
            field: "default_sale_price",
            label: "Default Sale Price",
            type: "textfield",
            changeListener: event => handleNumberInputChange(event, formValues, setFormValues),
            textFieldProps: {
                required: true,
                type: "number",
                inputProps: {
                    step: 0.01
                }
            },
            gridProps: {
                width: 150,
                type: "rightAligned",
                valueGetter: PriceCellRenderer,
                comparator: stringValueToNumberComparator
            }
        },
        {
            field: "collection_price",
            label: "Collection Sale Price",
            type: "textfield",
            changeListener: event => handleNumberInputChange(event, formValues, setFormValues),
            textFieldProps: {
                required: true,
                type: "number",
                inputProps: {
                    step: 0.01
                }
            },
            gridProps: {
                width: 150,
                type: "rightAligned",
                valueGetter: PriceCellRenderer,
                comparator: stringValueToNumberComparator
            }
        },
        {
            field: "weight_kg",
            label: "Weight(kg)",
            type: "textfield",
            defaultState: 0,
            changeListener: event => handleNumberInputChange(event, formValues, setFormValues),
            textFieldProps: {
                required: true,
                type: "number",
                inputProps: {
                    step: 1
                }
            },
            gridProps: {
                type: "rightAligned"
            }
        },
        {
            field: "weight_grams",
            label: "Weight(g)",
            type: "textfield",
            defaultState: 0,
            changeListener: event => handleNumberInputChange(event, formValues, setFormValues),
            textFieldProps: {
                type: "number",
                inputProps: {
                    step: 1
                }
            },
            gridProps: {
                type: "rightAligned"
            }
        },
        {
            field: "tags",
            label: "Tag(s)",
            type: "chips_dropdown",
            dropdownOptions: tagsData,
            dropdownNameField: "name",
            defaultState: [],
            changeListener: tagsChangeListener,
            textFieldProps: {
                required: true,
                type: "text"
            },
            gridProps: {
                cellRenderer: listChipsCellRenderer,
                cellRendererParams: {
                    idMapping: tagsData.map,
                    mappingDataLoaded: tagsData.loaded,
                    nameField: "name"
                },
                filter: tagsFilter,
                filterParams: {
                    columnName: "tags",
                    tagsList: tagsData
                }
            }
        },
        ... currentUserHasPermissions([process.env.REACT_APP_WRITE_INVENTORY_CLAIM]) ? [{
            field: "supplier1",
            label: "Supplier 1",
            type: "dropdown",
            defaultState: null,
            dropdownOptions: suppliersData,
            changeListener: inputChangeListener,
            textFieldProps: {
                type: "text"
            },
            gridProps: {
                width: 150,
                valueGetter: props => LinkedFieldCellValueGetterRenderer({
                    ...props,
                    idMapping: suppliersData.map,
                    mappedFieldName: "name",
                    mappingDataLoaded: suppliersData.loaded
                })
            }
        }] : [],
        ... currentUserHasPermissions([process.env.REACT_APP_WRITE_INVENTORY_CLAIM]) ? [{
            field: "supplier2",
            label: "Supplier 2",
            type: "dropdown",
            defaultState: null,
            dropdownOptions: suppliersData,
            changeListener: inputChangeListener,
            textFieldProps: {
                type: "text"
            },
            gridProps: {
                width: 150,
                valueGetter: props => LinkedFieldCellValueGetterRenderer({
                    ...props,
                    idMapping: suppliersData.map,
                    mappedFieldName: "name",
                    mappingDataLoaded: suppliersData.loaded
                })
            }
        }] : [],
        ... currentUserHasPermissions([process.env.REACT_APP_WRITE_INVENTORY_CLAIM]) ? [{
            field: "supplier3",
            label: "Supplier 3",
            type: "dropdown",
            defaultState: null,
            dropdownOptions: suppliersData,
            changeListener: inputChangeListener,
            textFieldProps: {
                type: "text"
            },
            gridProps: {
                width: 150,
                valueGetter: props => LinkedFieldCellValueGetterRenderer({
                    ...props,
                    idMapping: suppliersData.map,
                    mappedFieldName: "name",
                    mappingDataLoaded: suppliersData.loaded
                })
            }
        }] : []
    ];

    const checkboxColumnDef = { headerName: "", checkboxSelection: true, headerCheckboxSelection: true, headerCheckboxSelectionFilteredOnly:true, filter: false, minWidth: 60, maxWidth: 60 }

    useEffect(() => {
        fetchAllItems();
        currentUserHasPermissions(requiredShowStockValuePermissions) && setInventoryAlertModalOpen(true);
    }, []);

    useEffect(() => {
        if (editMode) {
            setEditModeOriginalDataCopy(_.cloneDeep(formValues));
            setDialogOpen(true);
        } else {
            setEditModeOriginalDataCopy(_.cloneDeep(formValues));
            setDialogOpen(false);
        }
    }, [editMode]);

    const defaultFormState = getDefaultFormFields(itemData);
    const [formValues, setFormValues] = useState({...defaultFormState});
    const colDefs = [getActionColumnDef(setEditMode, setFormValues, API_NAME, displaySnackState, setSnackState, setSendingData, fetchAllItems, !currentUserHasPermissions(requiredDeletePermissions), requiredWritePermissions, showImageFunction), checkboxColumnDef, ...getColumnDefs(itemData)];

    // if(!currentUserHasPermissions(process.env.REACT_APP_DELETE_INVENTORY_ITEMS)) {
    //     return "YOU DO NOT HAVE PERMISSION TO ACCESS THIS PAGE";
    // }

    return <div style={{height: "90%"}}>
        <CustomisedSnackBar {...snackState} setClosed={setSnackState}/>
        {inventoryAlertModalOpen && <InventoryAlertModal items={getItemsAtAlertLevel()} handleClose={() => setInventoryAlertModalOpen(false)}/>}
        {customerPricesBelowCostModalOpen && <CustomerPriceBelowCostModal data={customerPricesBelowCostData} handleClose={() => setCustomerPricesBelowCostModalOpen(false)}/>}
        <CustomConfirmModal open={confirmDialogOpen.open} callbacks={confirmDialogOpen.callbacks} message={"Should customers prices set to default?\n(Choosing YES will also reset Collection price to Minimum Sale price)"} />
        <ImageViewDialog _id={imageDialogID} open={imageDialogOpen} handleClose={handleCloseImageDialog}/>
        <Dialog open={dialogOpen} fullScreen>
            <DialogClosingTitleBar title={`${editMode ? "EDIT" : "ADD"} ITEM`} handleClose={handleCloseDialog}/>
            <div>
                <Card className={cardStyles.popupFormCard}>
                    <CardContent>
                        <form onSubmit={editMode ? handleEditSubmit : handleSubmit}>
                            {getGridFormInputFields(getInputFields(itemData, formValues))}
                            {editMode ? (
                                    <div>
                                        <img
                                            alt="not found"
                                            width={"250px"}
                                            height={"250px"}
                                            src={URL_ROOT + URL_API + API_NAME + '/image/' + formValues._id}
                                        />
                                        <br />
                                        <button onClick={handleRemoveImage}>Remove</button>
                                        <input
                                            type={"file"}
                                            name="myImage"
                                            accept="image/*"
                                            onChange={handleUploadImage}
                                        />
                                    </div>
                            ) : ""
                            }
                            <br />
                            <br />
                            <LoadingButton loading={sendingData} icon={editMode ? <EditIcon/> : <AddIcon/>}
                                           buttonLabel={`${editMode ? "EDIT" : "ADD"} ITEM`} disabled={sendingData}/>
                            {editMode ? <Button variant="contained" color="error"
                                                onClick={disableEditMode}>CANCEL</Button> : ""}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Dialog>
        <Button variant="contained" onClick={handleOpenDialog} style={{marginRight: "1em"}} disabled={!currentUserHasPermissions(requiredWritePermissions)}>Add Item</Button>
        <Button variant="contained" onClick={fetchAllItems} style={{marginRight: "1em"}}>Reload</Button>
        <Button variant="contained" onClick={() => openItemsListPDF("items.pdf")} disabled={selectedItems.length === 0} style={{marginRight: "1em"}}>Print Selected Items({selectedItems.length})</Button>
        <Button variant="contained" onClick={() => openItemsInStockPDF("itemsInStock.pdf")} style={{marginRight: "1em"}}>Print In Stock Items</Button>
        {currentUserHasPermissions(requiredInventoryAlertPermissions)  && <Button variant="contained" onClick={() => setInventoryAlertModalOpen(true)} style={{marginRight: "1em"}}>Show
            stock alerts</Button>}
        {currentUserHasPermissions(requiredShowStockValuePermissions) && <Button variant="contained" onClick={showStockValue}
                 disabled={!currentUserHasPermissions(requiredShowStockValuePermissions)} style={{marginRight: "1em"}}>Show
            Stock Value</Button>}
        {currentUserHasPermissions(requiredCSVPermission) && <Button variant="contained" onClick={csvAction} disabled={sendingData} style={{marginRight: "1em"}}>CSV</Button>}
        {currentUserHasPermissions(requiredInventoryAlertPermissions)  && <Button variant="contained" onClick={showCustomersWithPriceBelowCost} style={{marginRight: "1em"}}>Price below cost</Button>}
        {currentUserHasPermissions(requiredResetNegativesPermissions) && <Button variant="contained" onClick={resetNegativeInventory}
                 disabled={!currentUserHasPermissions(requiredResetNegativesPermissions)} style={{marginRight: "1em"}}>Reset
            Negatives to 0</Button>}
        <DataViewGrid
            getGridApi={setGridApi}
            rowData={rowData}
            columnDefs={colDefs}
            loading={sendingData}
            postFilterChangedCallback={filterChangedHandler}
            agGridProps={{
                rowSelection: "multiple",
                suppressRowClickSelection: true,
                checkboxSelection: true,
                onSelectionChanged: rowSelectionChanged
            }}
        />
    </div>
};