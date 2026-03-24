import React from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import {FormControlLabel, FormGroup, Grid, Switch} from "@mui/material";

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: "50%",
    height: "50%",
    bgcolor: 'background.paper',
    border: '2px solid blue',
    boxShadow: 24,
    p: 4,
};

const SettingsModal = props => {

    const changeTheme = () => {
        props.updateUserPreferences({
            ...props.userPreferences,
            theme: props.userPreferences.theme === "dark" ? "light" : "dark"
        });
    };

    return <Modal
        open={true}
        onClose={props.handleClose}
    >
        <Box sx={style}>
            <Grid container direction={"column"} alignItems={"center"}>
                <Grid item>
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={props.userPreferences.theme === 'dark'}
                                    onChange={changeTheme}
                                    aria-label="theme switch"
                                />
                            }
                            label={props.userPreferences.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        />
                    </FormGroup>
                </Grid>
            </Grid>
        </Box>
    </Modal>
};

export default SettingsModal;