import React, {useEffect, useState} from "react";
import {Backdrop, Box, Button, CircularProgress, Grid, TextField, Typography} from "@mui/material";
import {
    createCustomerItemsList, currentUserHasPermissions,
    defaultLoadedFieldData,
    defaultSnackState, editCustomerItemsList,
    fetchDropdownField, fetchEntries, getAndOpenCustomerItemsPrintoutInNewTab
} from "../../components/formFunctions/FormFunctions";
import CustomisedSnackBar from "../../components/customisedSnackBar/CustomisedSnackBar";
import displaySnackState from "../../components/customisedSnackBar/DisplaySnackState";
import Autocomplete from "@mui/material/Autocomplete";
import DataViewGrid from "../../components/DataViewGrid/DataViewGrid";
import {CustomerItemRemoveCellRenderer} from "../../components/cellRenderers/CustomerItemRemoveCellRenderer";
import PrintIcon from '@mui/icons-material/Print';

const API_NAME = "/customerItems";

export const CustomerItems = props => {
    const requiredPriceOverridePermission = [process.env.REACT_APP_WRITE_OVERRIDE_MIN_SALE_PRICE_CLAIM];
    const [snackState, setSnackState] = useState(defaultSnackState);
    const {selectedCustomerData} = props;
    const [sendingData, setSendingData] = useState(false);
    const [inventoryData, setInventoryData] = useState(defaultLoadedFieldData);
    const [customerItems, setCustomerItems] = useState(null);
    const [customerItemsLoaded, setCustomerItemsLoaded] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [customPriceValid, setCustomPriceValid] = useState(true);
    const [gridApi, setGridApi] = useState(null);
    const [allCustomrItemsNames, setAllCustomerItemsNames] = useState([]);
    const [selectedCustomerItem, setSelectedCustomerItem] = useState(null);   

    const getInventoryList = () => {
        fetchDropdownField("/inventory", setInventoryData, setSnackState, false);
    };
    const getCustomerItems = (selectedCustomerData, add = false) => {
        const onSuccess = response => {
            if(response.data) {
                if(add){
                     setCustomerItems(prevState => ({
                        ...prevState,
                        items: response.data.items.map((itm)=>{
                            return {
                                _id:itm._id,
                                rate: inventoryData.map[itm._id].default_sale_price,
                            }
                        })
                     }))                                                                            
                }else{
                    setCustomerItems(response.data);
                }
            } else {
                setCustomerItems({
                    customer: selectedCustomerData._id,
                    items: []
                })
            }
            setCustomerItemsLoaded(true);
        };
        const onFail = error => {
            console.error(error);
            displaySnackState(`Failed to fetch all customer items data - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
        }
        fetchEntries(`${API_NAME}/${selectedCustomerData._id}`, onSuccess, onFail);
    };
    
    const getAllCustomerItemsNames = () => {
        const onSuccess = response => {
            if(response.data) {
                setAllCustomerItemsNames(response.data);
            }
            setCustomerItemsLoaded(true);
        };
        const onFail = error => {
            console.error(error);
            displaySnackState(`Failed to get all customer items data - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
        }
        fetchEntries(`${API_NAME}/customerItemNames`, onSuccess, onFail);
    };
    const loadAllData = () => {
        getInventoryList();
        getCustomerItems(selectedCustomerData, false);
        getAllCustomerItemsNames();
    };

    useEffect(() => {
        loadAllData();
    }, []);

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

    const selectUserChangeListener = (item) =>{
        setSelectedCustomerItem(item)
    }

    const handleAddItem = event => {
        event.preventDefault();
        const customer_price = Number(event.target.custom_sale_price.value);
        if(!currentUserHasPermissions(requiredPriceOverridePermission) && customer_price < selectedItem.min_sale_price) {
            displaySnackState("Price cannot be below minimum sale price", "error", setSnackState);
        } else {
            setCustomerItems({
                ...customerItems,
                items: [...customerItems.items,
                    {
                        _id: selectedItem._id,
                        rate: customer_price
                    }
                    ]
            });
            setSelectedItem(null);
        }
    };

    const handleAddExistingCustomerItems = event => {
        event.preventDefault();
        getCustomerItems(selectedCustomerItem, true);
    }

    const submitNewItemsData = itemsList => {
        const data = {
            ...customerItems,
            items: itemsList
        };
        if(customerItems._id) {
            editCustomerItemsList(API_NAME, data, setSendingData, setSnackState, loadAllData);
        } else {
            createCustomerItemsList(API_NAME, data, setSendingData, setSnackState, loadAllData);
        }
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

    const printCustomerItems = (type) => {
        getAndOpenCustomerItemsPrintoutInNewTab(selectedCustomerData._id, setSnackState, type);
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
            editable: true,
            valueSetter: (params) => {
                const newValue = parseFloat(params.newValue);
                if (!isNaN(newValue)) {
                    params.data.rate = newValue;
                    return true;
                }
                return false;
            }
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
            cellRenderer: CustomerItemRemoveCellRenderer,
            cellRendererParams: {
                customerItems: customerItems,
                setCustomerItems: setCustomerItems
            }
        }
    ];

    return <div style={{height: "100%"}}>
        <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
        <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={!inventoryData.loaded || !customerItemsLoaded || sendingData}
        >
            <CircularProgress color="inherit" />
        </Backdrop>
        <Box sx={{marginLeft: "1%", marginRight: "1%", display:{xs:"block", md:"flex"}}}>
            <form onSubmit={handleAddItem} style={{ flex: '0 0 75%' }}>
                <Grid container spacing={1} alignItems="center" justifyContent="left">
                    <Grid item xs={12} sm={4}>
                        <Autocomplete
                            name="items"
                            options={Object.keys(inventoryData.map).map(key => inventoryData.map[key]).filter(item => item.active).filter(item => customerItems?.items.findIndex(custItem => custItem._id === item._id) === -1)}
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
                    <Grid item xs={12} sm={1}>
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
                    <Grid item xs={12} sm={1}>
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
                    <Grid item xs={12} sm={4}>
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
                    <Grid item xs={12} sm={1} sx={{textAlign:'center'}}>
                        <Button variant="contained" type={"submit"} disabled={!selectedItem}>ADD</Button>
                    </Grid>
                    <Grid item xs={12} sm={1}>
                        <Button variant="contained" onClick={handleSaveItems}>SAVE</Button>
                    </Grid>
                </Grid>
            </form>
            <form onSubmit={handleAddExistingCustomerItems} style={{ flex: '0 0 25%' }}>
                <Grid container spacing={1} alignItems="center" justifyContent="left">
                    <Grid item xs={12} sm={8}>
                        <Autocomplete
                            name="username"
                            options={allCustomrItemsNames}
                            onChange={(event, item) => selectUserChangeListener(item)}
                            value={selectedCustomerItem}
                            autoComplete={false}
                            fullWidth
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="standard"
                                    label="Existing Customer"
                                />
                            )}
                            getOptionLabel={option => option.customer_name}
                        />
                    </Grid>                    
                    <Grid item xs={12} sm={4}>
                        <Button variant="contained" type={"submit"} disabled={!selectedCustomerItem}>Add Products</Button>
                    </Grid>
                </Grid>
            </form>
        </Box>
        <Button variant="contained" onClick={() => printCustomerItems("prices")} endIcon={<PrintIcon />}>PRINT</Button>
        <Button variant="contained" onClick={() => printCustomerItems("stock")} endIcon={<PrintIcon />} sx={{ml:4}}>PRINT CUSTOMER STOCK ITEMS</Button>
        <div style={{height: "75vh", marginTop: "10px", marginBottom: "10px"}}>
            <DataViewGrid rowData={customerItems ? customerItems.items : []} columnDefs={colDefs} loading={!inventoryData.loaded || !customerItemsLoaded || sendingData} getGridApi={setGridApi}/>            
        </div>       
    </div>
};