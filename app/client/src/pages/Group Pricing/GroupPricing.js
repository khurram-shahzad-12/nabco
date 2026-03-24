import React, {useEffect, useState} from "react";
import {Backdrop, Button, CircularProgress, Grid, TextField, Typography} from "@mui/material";
import {
    currentUserHasPermissions,
    defaultLoadedFieldData,
    defaultSnackState,
    fetchDropdownField, getAndOpenCustomerGroupItemsPrintoutInNewTab, handleDataEditSubmit
} from "../../components/formFunctions/FormFunctions";
import CustomisedSnackBar from "../../components/customisedSnackBar/CustomisedSnackBar";
import displaySnackState from "../../components/customisedSnackBar/DisplaySnackState";
import Autocomplete from "@mui/material/Autocomplete";
import DataViewGrid from "../../components/DataViewGrid/DataViewGrid";
import {GroupPricingRemoveCellRenderer} from "../../components/cellRenderers/GroupPricingItemRemoveCellRenderer";
import PrintIcon from "@mui/icons-material/Print";

const API_NAME = "/customerGroups";

export const GroupPricing = props => {
    const requiredPriceOverridePermission = [process.env.REACT_APP_WRITE_OVERRIDE_MIN_SALE_PRICE_CLAIM];
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [sendingData, setSendingData] = useState(false);
    const [selectedCustomerGroup, setSelectedCustomerGroup] = useState(null);
    const [customerGroupsData, setCustomerGroupsData] = useState(defaultLoadedFieldData);
    const [inventoryData, setInventoryData] = useState(defaultLoadedFieldData);
    const [selectedItem, setSelectedItem] = useState(null);
    const [customPriceValid, setCustomPriceValid] = useState(true);
    const [gridApi, setGridApi] = useState(null);

    const getInventoryList = () => {
        fetchDropdownField("/inventory", setInventoryData, setSnackState, false);
    };

    const getCustomerGroupsData = () => {
        fetchDropdownField(API_NAME, setCustomerGroupsData, setSnackState, false);
    };

    const loadAllData = () => {
        getInventoryList();
        getCustomerGroupsData();
    };

    useEffect(() => {
        loadAllData();
    }, []);

    const reloadButtonHandler = () => {
        loadAllData();
        customerGroupChangeListener(null);
    };

    const customerGroupChangeListener = (customer) => {
        setSelectedCustomerGroup(customer);
    };

    const itemChangeListener = (item) => {
        setSelectedItem(item);
    };

    const priceChangeListener = event => {
        const {value} = event.target;
        const newPrice = Number(value);
        if(newPrice < selectedItem.min_sale_price) {
            setCustomPriceValid(false);
        } else {
            setCustomPriceValid(true);
        }
    };

    const handleAddItem = event => {
        event.preventDefault();
        const customer_price = Number(event.target.custom_sale_price.value);
        if(!currentUserHasPermissions(requiredPriceOverridePermission) && customer_price < selectedItem.min_sale_price) {
            displaySnackState("Price cannot be below minimum sale price", "error", setSnackState);
        } else {
            setSelectedCustomerGroup({
                ...selectedCustomerGroup,
                items: [...selectedCustomerGroup.items,
                    {
                        _id: selectedItem._id,
                        rate: customer_price
                    }
                    ]
            });
            setSelectedItem(null);
        }
    };

    const submitNewItemsData = itemsList => {
        const data = {
            ...selectedCustomerGroup,
            items: itemsList
        };
        const emptyFunction = () => {}
        handleDataEditSubmit(API_NAME, null, setSendingData, emptyFunction, data, loadAllData, emptyFunction, setSnackState, null);
    };

    const handleSaveItems = () => {
        if(!gridApi) {
            alert("Grid API not ready, please wait before trying again");
        } else {
            const finalItemsList = []
            gridApi.api.stopEditing();
            gridApi.api.forEachNode(node => {
                const currentItemData = {...node.data};
                finalItemsList.push(currentItemData);
            });

            finalItemsList.sort((a, b) => {
                return inventoryData.map[a._id].name > inventoryData.map[b._id].name ? 1 :
                    inventoryData.map[a._id].name < inventoryData.map[b._id].name ? -1 : 0;
            })
            submitNewItemsData(finalItemsList);
        }
    };

    const getItemNameFromID = props => {
        if(!inventoryData.loaded) {
            return "Loading...";
        } else {
            return inventoryData.map[props.data._id].name;
        }
    };

    const getMinPriceFromID = props => {
        if(!inventoryData.loaded) {
            return "Loading...";
        } else {
            return inventoryData.map[props.data._id].min_sale_price.toFixed(2);
        }
    };

    const getDefaultFromID = props => {
        if(!inventoryData.loaded) {
            return "Loading...";
        } else {
            return inventoryData.map[props.data._id].default_sale_price.toFixed(2);
        }
    };

    const printCustomerGroupItems = () => {
        getAndOpenCustomerGroupItemsPrintoutInNewTab(selectedCustomerGroup._id, setSnackState);
    };

    const colDefs = [
        {
            field: "_id",
            headerName: "Item Name",
            valueGetter: getItemNameFromID
        },
        {
            field: "rate",
            headerName: "Customer Price",
            editable: true
        },
        {
            field: "_id",
            headerName: "Min Price",
            valueGetter: getMinPriceFromID
        },
        {
            field: "_id",
            headerName: "Default Price",
            valueGetter: getDefaultFromID
        },
        {
            field: "_id",
            headerName: "Action",
            floatingFilter: false,
            filter: false,
            cellRenderer: GroupPricingRemoveCellRenderer,
            cellRendererParams: {
                selectedCustomerGroup: selectedCustomerGroup,
                setSelectedCustomerGroup: setSelectedCustomerGroup
            }
        }
    ];

    return <div style={{height: "100%"}}>
        <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
        <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={!inventoryData.loaded || sendingData}
        >
            <CircularProgress color="inherit" />
        </Backdrop>
        <div style={{marginLeft: "5%", marginRight: "5%"}}>
            <form onSubmit={handleAddItem}>
                <Grid container spacing={1} alignItems="center" justifyContent="center">
                    <Grid item xs={12}>
                        <Autocomplete
                            name="Customer"
                            options={Object.keys(customerGroupsData.map).map(key => customerGroupsData.map[key])}
                            onChange={(event, customerGroup) => customerGroupChangeListener(customerGroup)}
                            value={selectedCustomerGroup}
                            autoComplete={false}
                            fullWidth
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="standard"
                                    label="Customer Group"
                                />
                            )}
                            getOptionLabel={option => option.name}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Autocomplete
                            name="items"
                            options={Object.keys(inventoryData.map).map(key => inventoryData.map[key]).filter(item => item.active).filter(item => selectedCustomerGroup?.items.findIndex(custItem => custItem._id === item._id) === -1)}
                            onChange={(event, item) => itemChangeListener(item)}
                            value={selectedItem}
                            autoComplete={false}
                            fullWidth
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="standard"
                                    label="Item"
                                />
                            )}
                            getOptionLabel={option => option.name}
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField label={"Minimum Sale Price"}
                                   name={"min_sale_price"}
                                   value={selectedItem?.min_sale_price.toFixed(2)}
                                   variant="outlined"
                                   autoComplete="off"
                                   fullWidth
                                   disabled
                                   InputLabelProps={{shrink: true}}
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField label={"Default Sale Price"}
                                   name={"default_sale_price"}
                                   value={selectedItem?.default_sale_price.toFixed(2)}
                                   variant="outlined"
                                   autoComplete="off"
                                   fullWidth
                                   disabled
                                   InputLabelProps={{shrink: true}}
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField label={"Custom Sale Price"}
                                   name={"custom_sale_price"}
                                   error={!customPriceValid}
                                   variant="outlined"
                                   autoComplete="off"
                                   fullWidth
                                   required
                                   onChange={priceChangeListener}
                                   type="number"
                                   inputProps={{
                                       step: 0.01
                                   }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={1}>
                        <Button variant="contained" type={"submit"} disabled={!selectedItem}>ADD</Button>
                    </Grid>
                    <Grid item xs={12} sm={1}>
                        <Button variant="contained" onClick={handleSaveItems}>SAVE</Button>
                    </Grid>
                    <Grid item xs={12} sm={1}>
                        <Button variant="contained" disabled={selectedCustomerGroup === null} onClick={printCustomerGroupItems} endIcon={<PrintIcon />}>PRINT</Button>
                    </Grid>
                    <Grid item xs={12} sm={1}>
                        <Button variant="contained" onClick={reloadButtonHandler}>RELOAD</Button>
                    </Grid>
                </Grid>
            </form>
        </div>
        <div style={{height: "500px", marginTop: "10px", marginBottom: "10px"}}>
            <DataViewGrid rowData={selectedCustomerGroup ? selectedCustomerGroup.items : []} columnDefs={colDefs} loading={!inventoryData.loaded || sendingData} getGridApi={setGridApi}/>
        </div>
    </div>
};