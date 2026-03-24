import React from 'react';
import {TextField} from "@mui/material";
import {getMenuItemsForDropdown} from "../formFunctions/FormFunctions";

const SectionDropdownFieldCellRenderer = (props) => {
    const {sectionData, selectedZones, rowIndex} = props;
    let menuItems = [];

    if(selectedZones[rowIndex] !== null) {
        const validSectionItems = sectionData.filter(section => section.zone === selectedZones[rowIndex]);
        menuItems = getMenuItemsForDropdown(validSectionItems);
    }

    return <TextField
        name="section"
        value={props.value}
        variant="outlined"
        autoComplete="off"
        onChange={event => props.changeListener(event, props.rowIndex)}
        select
        fullWidth
        disabled={selectedZones[rowIndex] === null}
    >
        {menuItems}
    </TextField>
};

export default SectionDropdownFieldCellRenderer;