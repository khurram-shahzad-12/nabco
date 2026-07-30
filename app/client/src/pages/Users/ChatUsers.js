import React, { useEffect, useState } from 'react';
import {
    defaultSnackState,
    fetchAllEntriesAndSetRowData,
    handleDeleteEntry,
} from "../../components/formFunctions/FormFunctions";
import CustomisedSnackBar from "../../components/customisedSnackBar/CustomisedSnackBar";
import { Button } from "@mui/material";
import DataViewGrid from "../../components/DataViewGrid/DataViewGrid";
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

const API_NAME = '/chatuser';

export const ChatUser = () => {
    const [sendingData, setSendingData] = useState(false);
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [rowData, setRowData] = useState([]);

    const fetchAllUsers = () => {
        fetchAllEntriesAndSetRowData(API_NAME, null, setSendingData, setRowData, setSnackState);
    };
    const deleteChatUser = (id) => {
        console.log(id)
        if (window.confirm("Are you sure you want to delete this user?")) {
            handleDeleteEntry(API_NAME, id, setSendingData, setSnackState, fetchAllUsers);
        }
    };
    useEffect(() => {
        fetchAllUsers();
    }, []);

    const colDefs = [
        {
            field: "user_name",
            headerName: "User Name",
            flex: 1,
        },
        {
            field: "last_seen",
            headerName: "Last Seen",
            flex: 1.5,
            valueFormatter: props =>
                props.value ? new Date(props.value).toLocaleString() : "",
        },
        {
            headerName: "Action",
            width: 100,
            cellRenderer: (params) => (
                <Tooltip title="Delete">
                    <IconButton
                        color="error"
                        onClick={() => deleteChatUser(params.data._id)}
                    >
                        <DeleteIcon />
                    </IconButton>
                </Tooltip>
            ),
        }
    ];

    return (
        <div style={{ height: "90%" }}>
            <CustomisedSnackBar
                {...snackState}
                setClosed={setSnackState}
            />

            <Button
                variant="contained"
                onClick={fetchAllUsers}
            >
                Reload
            </Button>

            <DataViewGrid
                rowData={rowData}
                columnDefs={colDefs}
                loading={sendingData}
            />
        </div>
    );
};