import React from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import {Grid} from "@mui/material";
import {momentFormat} from "../formFunctions/FormFunctions";
import moment from "moment";

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: "25%",
    height: "50%",
    bgcolor: 'background.paper',
    border: '2px solid blue',
    boxShadow: 24,
    p: 4,
    overflowY: 'auto'
};

const dateFormat = 'DD-MM-YYYY';

const AccountsTotalModal = props => {

    return <Modal
        open={true}
        onClose={props.handleClose}
    >
        <Box sx={style}>
            <Grid container direction={"column"} alignItems={"left"}>
                <Grid item>
                    Totals for period {moment(props.startDate).format(dateFormat)} TO {moment(props.endDate).format(dateFormat)}
                </Grid>
                {Object.keys(props.totals).map(key => {
                    return <Grid item key={key}>
                        {key + " - £" + Number(props.totals[key]).toFixed(2)}
                    </Grid>
                })}
            </Grid>
        </Box>
    </Modal>
};

export default AccountsTotalModal;