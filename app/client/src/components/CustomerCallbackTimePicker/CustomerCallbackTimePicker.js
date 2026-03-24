import React, {useEffect, useState} from "react";
import AdapterDateFns from "@mui/lab/AdapterDateFns";
import {TimePicker} from "@mui/lab";
import {Button, TextField} from "@mui/material";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import moment from "moment";

const CustomerCallbackTimePicker = props => {
    const [selectedTime, setSelectedTime] = useState(moment(new Date()));
    const [commentValue, setCommentValue] = useState("");

    const setNewTime = newTime => {
        setSelectedTime(newTime);
    };

    const handleSubmit = e => {
        e.preventDefault();
        props.saveFunction(selectedTime, commentValue);
    };

    return <div>
        <form onSubmit={handleSubmit}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker
                    label="Time"
                    value={selectedTime}
                    // onChange={(value, kbValue) => {console.log(value, kbValue)}}
                    onChange={setNewTime}
                    renderInput={(params) => <TextField {...params} />}
                />
            </LocalizationProvider>
            <TextField
                label={"Comment"}
                name={"comment"}
                onChange={e => setCommentValue(e.target.value)}
                variant="outlined"
                autoComplete="off"
                fullWidth
                multiline
                rows={3}
                type={"text"}
            />
            <Button variant="contained" type="submit">Save</Button>
        </form>
    </div>
};

export default CustomerCallbackTimePicker;