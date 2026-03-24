import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import React from "react";
import DefaultTopAnchorPosition from "../../configs/SnackBarDefaultTopAnchor";

const CustomisedSnackBar = props => {

    const closeFunction = () => {
        props.setClosed({open: false})
    };

    return <Snackbar
        anchorOrigin={DefaultTopAnchorPosition}
        open={props.open}
        onClose={closeFunction}
    >
        <Alert variant='filled' onClose={closeFunction} severity={props.severity} sx={{ width: '100%' }} >
            {props.message}
        </Alert>
    </Snackbar>
};

export default CustomisedSnackBar;