import React from 'react';
import {TextField} from "@mui/material";
import MenuItem from "@mui/material/MenuItem";

const ZoneDropdownFieldCellRenderer = (props) => {

    const nullMenuItem = <MenuItem value={null} key={Math.random()}>None</MenuItem>

    const menuEntries = [nullMenuItem, ...props.menuEntries];

    return <TextField
        name="zone"
        value={props.value}
        variant="outlined"
        autoComplete="off"
        onChange={event => props.changeListener(event, props.rowIndex)}
        select
        fullWidth
    >
        { menuEntries }
    </TextField>
};

export default ZoneDropdownFieldCellRenderer;