import React from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import {Button} from "@mui/material";

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: "auto",
    height: "auto",
    bgcolor: 'background.paper',
    border: '2px solid blue',
    boxShadow: 24,
    p: 4,
    overflowY: 'auto'
};

const CustomConfirmModal = props => {

    const handleCloseInner = () => {
        return;
    };

    return <Modal
        open={props.open}
        onClose={handleCloseInner}
    >
        <Box sx={style}>
            <div>
                {props.message}
            </div>
            <div>
                <Button variant="contained" onClick={props.callbacks?.yes}>YES</Button>
                <Button variant="contained" onClick={props.callbacks?.no}>NO</Button>
                <Button variant="contained" onClick={props.callbacks?.cancel}>CANCEL</Button>
            </div>
        </Box>
    </Modal>
};

export default CustomConfirmModal;