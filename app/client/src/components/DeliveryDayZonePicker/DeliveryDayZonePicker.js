import React, {useState} from "react";
import {daysMap, getIDMappingForElement} from "../formFunctions/FormFunctions";
import DataViewGrid from "../DataViewGrid/DataViewGrid";
import ZoneDropdownFieldCellRenderer from "../cellRenderers/ZoneDropdownFieldCellRenderer";
import SectionDropdownFieldCellRenderer from "../cellRenderers/SectionDropdownFieldCellRenderer";

const DeliveryDayZonePicker = props => {
    const {zonesData, existingZoneSelection, zoneChange} = props;
    const [selectedZones, setSelectedZones] = useState(existingZoneSelection);

    const onZoneChangeListener = (event, index) => {
        const {value} = event.target;
        let newZones = [...selectedZones];
        newZones[index] = value;

        zoneChange(newZones);
    };

    const rowData = daysMap.map((day, index) => {
        return {
            day: day,
            zone: selectedZones[index]
        }
    });

    const colDef = [
        {
            field: "day",
            headerName: "Day",
            floatingFilter: false,
            filter: false
        },
        {
            field: "zone",
            headerName: "Zone",
            width: 175,
            floatingFilter: false,
            filter: false,
            cellRenderer: ZoneDropdownFieldCellRenderer,
            cellRendererParams: {
                changeListener: onZoneChangeListener,
                menuEntries: zonesData.menuEntries
            }
        }
    ];

    return <DataViewGrid rowData={rowData} columnDefs={colDef} />;
};

export default DeliveryDayZonePicker;