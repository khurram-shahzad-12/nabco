import React, {useState} from "react";
import Modal from '@mui/material/Modal';
import Box from "@mui/material/Box";
import {
    defaultSnackState, getColumnDefs,
    getDefaultFormFields, getGridFormInputFields,
    getInputFields, handleDataEditSubmit,
    handleInputChange, stringValueToNumberComparator
} from "../formFunctions/FormFunctions";
import {Button, TextField} from "@mui/material";
import DataViewGrid from "../DataViewGrid/DataViewGrid";
import {LoadingButton} from "../loadingButton/LoadingButton";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import CustomisedSnackBar from "../customisedSnackBar/CustomisedSnackBar";
import {PaymentActionCellRenderer} from "../cellRenderers/PaymentActionCellRenderer";
import {PriceCellRenderer} from "../cellRenderers/PriceCellRenderer";
import MenuItem from "@mui/material/MenuItem";
import {useAuth0} from "@auth0/auth0-react";
import {URL_API, URL_ROOT} from "../../configs/config";

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: "70%",
    height: "70%",
    bgcolor: 'background.paper',
    border: '2px solid blue',
    boxShadow: 24,
    p: 4,
};

const API_NAME = "/inventory"

const ImageViewDialog = props => {

    return <Modal
        open={props.open}
        onClose={props.handleClose}
    >
        <Box sx={style}>
            <div style={{height: "100%", overflow: "auto"}}>
                <img
                    alt="not found"
                    max-width={"100%"}
                    max-height={"100%"}
                    src={URL_ROOT + URL_API + API_NAME + '/image/' + props._id}
                />
            </div>
        </Box>
    </Modal>
};

export default ImageViewDialog;