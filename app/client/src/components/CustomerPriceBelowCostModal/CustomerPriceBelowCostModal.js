import React from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import {Grid} from "@mui/material";

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

const CustomerPriceBelowCostModal = props => {

    return <Modal
        open={true}
        onClose={props.handleClose}
    >
        <Box sx={style}>
            <Grid container direction={"column"} alignItems={"left"}>
                <Grid item>
                    CUSTOMERS WITH ITEM PRICES BELOW COST
                </Grid>
                <Grid item>
                    Customer - [Item]
                </Grid>
                {props.data.map(entry => {
                    return <Grid item>
                        {entry.customerName + " - [" + entry.itemName + "]"}
                    </Grid>
                })}
            </Grid>
        </Box>
    </Modal>
};

export default CustomerPriceBelowCostModal;