import React, {useEffect, useState} from "react";
import AdapterDateFns from "@mui/lab/AdapterDateFns";
import {TimePicker} from "@mui/lab";
import {Button, TextField} from "@mui/material";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import moment from "moment";
import Autocomplete from "@mui/material/Autocomplete";

const CustomerTemporaryOTPicker = props => {
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const setNewCustomer = (event, customer) => {
        setSelectedCustomer(customer);
    };

    const handleSubmit = e => {
        e.preventDefault();
        props.add(selectedCustomer._id);
    };

    return <div>
        <form onSubmit={handleSubmit}>
            <Autocomplete
                options={props.customers}
                onChange={setNewCustomer}
                autoComplete={false}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        variant="standard"
                    />
                )}
                getOptionLabel={option => option.customer_name}
            />
            <Button variant="contained" type="submit">Add</Button>
        </form>
    </div>
};

export default CustomerTemporaryOTPicker;