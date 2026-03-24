import React from "react";
import Toolbar from "@mui/material/Toolbar";
import {Typography} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import AppBar from "@mui/material/AppBar";

const DialogClosingTitleBar = props => {

    return <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                {props.title}
            </Typography>
            <IconButton
                edge="end"
                color="inherit"
                onClick={props.handleClose}
                aria-label="close"
            >
                <CloseIcon />
            </IconButton>
        </Toolbar>
    </AppBar>;
};

export default DialogClosingTitleBar;