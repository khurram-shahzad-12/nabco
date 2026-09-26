import React, { useEffect, useState } from 'react';
import {
    defaultSnackState,
    fetchAllEntriesAndSetRowData,
    handleDataSubmit
} from "../../components/formFunctions/FormFunctions";
import CustomisedSnackBar from "../../components/customisedSnackBar/CustomisedSnackBar";
import {Button, Dialog} from "@mui/material";
import LogoutIcon from '@mui/icons-material/Logout';
import DataViewGrid from "../../components/DataViewGrid/DataViewGrid";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useAuth } from '../../contexts/AuthContext';
const API_NAME = '/admin';

export const ActiveUsers = props => {
    const {hasPermission} = useAuth();
    const [sendingData, setSendingData] = useState(false);
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [rowData, setRowData] = useState([]);
    const requiredAdminPermissions = process.env.REACT_APP_RESET_NEGATIVE_INVENTORY_ITEMS;

    const fetchAllUsers = () => {
        fetchAllEntriesAndSetRowData(`${API_NAME}/activeUsers`, null, setSendingData, setRowData, setSnackState);
    };

    const handleSubmit = userData => {
        handleDataSubmit(`${API_NAME}/logOutUser`, null, setSendingData, userData, ()=>{}, {}, setSnackState, fetchAllUsers);
    };

    const getLogOutButtonCell = props => {
        return <Tooltip title="Logout User">
            <IconButton aria-label="logout user" onClick={() => handleSubmit(props.data)} disabled={!hasPermission(requiredAdminPermissions)}>
                <LogoutIcon />
            </IconButton>
        </Tooltip>
    };

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const colDefs = [
        {
            field: "name",
            headerName: "Name"
        },
        {
            field: "id",
            headerName: "",
            cellRenderer: getLogOutButtonCell
        }
    ]

    return <div style={{height: "90%"}}>
        <CustomisedSnackBar {...snackState} setClosed={setSnackState}/>
        <Button variant="contained" onClick={fetchAllUsers} disabled={!hasPermission(requiredAdminPermissions)}>Reload</Button>
        <DataViewGrid rowData={rowData} columnDefs={colDefs} loading={sendingData}/>
    </div>
}