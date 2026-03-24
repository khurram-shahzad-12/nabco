import React, {useEffect, useState} from "react";
import {Backdrop, Button, CircularProgress, Grid, TextField, Typography} from "@mui/material";
import {fetchAllEntriesAndSetRowDataViaPost, momentFormat} from "../formFunctions/FormFunctions";
import DataViewGrid from "../DataViewGrid/DataViewGrid";
import moment from "moment";
import AdapterDateFns from "@mui/lab/AdapterDateFns";
import DatePicker from "@mui/lab/DatePicker";
import LocalizationProvider from "@mui/lab/LocalizationProvider";

const ItemHistoryDisplay = props => {
    const {customer, item, productsList} = props;
    const [itemHistoryData, setItemHistoryData] = useState([]);
    const [sendingData, setSendingData] = useState(true);
    const [startDate, setStartDate] = useState(moment(new Date()).subtract(14, "days").format(momentFormat));
    const [endDate, setEndDate] = useState(moment(new Date()).format(momentFormat));

    const getHistoryData = () => {
        fetchAllEntriesAndSetRowDataViaPost(
            "/invoice/getItemHistory",
            {
                customerID: customer._id,
                itemID: item._id,
                startDate: startDate,
                endDate: endDate
            },
            setSendingData,
            setItemHistoryData,
            props.setSnackState
        );
    };

    const handleDateChange = (newDate, dateType) => {
        const momentDate = moment(newDate).format(momentFormat);
        if(dateType === "start") {
            setStartDate(momentDate);
        } else {
            setEndDate(momentDate);
        }
    };

    useEffect(() => {
        getHistoryData();
    }, [customer, item]);

    useEffect(() => {
        getHistoryData();
    }, []);

    const getFormattedDate = params => {
        return moment(params.value).format("YYYY-MM-DD");
    };

    const getCurrentItemQuantity = rowData => {
        const itemIndex = rowData.data.items.findIndex(invoice_item => invoice_item._id === item._id);
        if(itemIndex > -1) {
            return rowData.data.items[itemIndex].quantity;
        } else {
            return "ERROR: Quantity missing";
        }
    };

    const getCurrentItemPrice = rowData => {
        const itemIndex = rowData.data.items.findIndex(invoice_item => invoice_item._id === item._id);
        if(itemIndex > -1) {
            return rowData.data.items[itemIndex].rate.toFixed(2);
        } else {
            return "ERROR: Item missing";
        }
    };

    const colDefs = [
        {
            field: "invoice_date",
            headerName: "Inv Date",
            valueFormatter: getFormattedDate,
            floatingFilter: false,
            filter: false
        },
        {
            field: "sale_number",
            headerName: "Inv#",
            floatingFilter: false,
            filter: false
        },
        {
            field: "items",
            headerName: "Price",
            valueGetter: getCurrentItemPrice,
            floatingFilter: false,
            filter: false
        },
        {
            field: "items",
            headerName: "Quantity",
            valueGetter: getCurrentItemQuantity,
            floatingFilter: false,
            filter: false
        }
    ];

    return <div style={{height: "100%", border: "1px solid"}}>
        <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={sendingData}
        >
            <CircularProgress color="inherit" />
        </Backdrop>
        <Grid container>
            <Grid item xs={11}>
                <Typography noWrap >Item History - {productsList.map[item._id].name}</Typography>
            </Grid>
            <Grid item xs={1}>
                <Typography style={{cursor: "pointer", color: "red"}} onClick={props.closeItemHistory}>x</Typography>
            </Grid>
        </Grid>
        <div style={{height: "100%", display: "flex"}}>
            <div id={"dateRange"} style={{height: "100%", width: "30%", marginTop: "15px"}}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        label="Start Date"
                        value={startDate}
                        onChange={newDate => handleDateChange(newDate, "start")}
                        inputFormat="dd/MM/yyyy"
                        renderInput={(params) => <TextField {...params} />}
                    />
                </LocalizationProvider>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        label="End Date"
                        value={endDate}
                        onChange={newDate => handleDateChange(newDate, "end")}
                        inputFormat="dd/MM/yyyy"
                        renderInput={(params) => <TextField {...params} />}
                    />
                </LocalizationProvider>
                <Button variant="contained" onClick={getHistoryData}>Reload</Button>
            </div>
            <div id={"historyGridView"} style={{height: "100%", width: "70%"}}>
                <DataViewGrid rowData={itemHistoryData} columnDefs={colDefs} loading={sendingData} />
            </div>
        </div>
    </div>
};

export default ItemHistoryDisplay;