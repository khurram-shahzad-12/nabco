import React, {useEffect, useState} from "react";
import 'ag-grid-community/dist/styles/ag-grid.css'; // Core grid CSS, always needed
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'; // Optional theme CSS
import 'ag-grid-community/dist/styles/ag-theme-alpine-dark.css'; // Optional theme CSS
import {AgGridReact} from "ag-grid-react";
import {defaultColDef} from "../formFunctions/FormFunctions";
import {useTheme} from "@mui/material/styles";
import "./styles.css";

const DataViewGrid = props => {
    const theme = useTheme();
    const [localGridApi, setLocalGridApi] = useState(null);
    const [gridFilters, setGridFilters] = useState(null);

    const gridReady = gridApi => {
        gridApi.columnApi.autoSizeAllColumns();
        setLocalGridApi(gridApi);
        if(props.getGridApi) {
            props.getGridApi(gridApi);
        }
    };

    const autoSizeColumns = params => {
        const allColumns = params.columnApi.getAllDisplayedColumns();
        const columnsToAutoSize = allColumns.filter(col => {
            const colDef = col.getColDef();
            return colDef.width == null;
        }).map(col => col.getColId());
        if(columnsToAutoSize.length > 0 ){ params.columnApi.autoSizeColumns(columnsToAutoSize);}
    };

    const setLoadingOverlay = () => {
        if(localGridApi) {
            if(props.loading) {
                localGridApi.api.showLoadingOverlay();
            } else {
                localGridApi.api.hideOverlay();
            }
        }
    };

    const setAGGridFilters = () => {
        if(localGridApi) {
            localGridApi.api.setFilterModel(gridFilters);
        }
    };

    const filerChangedHandler = event => {
        setGridFilters(event.api.getFilterModel());
        if(props.postFilterChangedCallback) {
            props.postFilterChangedCallback(event);
        }
    };
    
    useEffect(() => {
        setLoadingOverlay();
        setAGGridFilters();
    }, [props.loading, localGridApi]);

    return <div
        id={`grid-theme-wrapper${theme.palette.mode === "dark" ? "-dark" : ""}`}
        className={`ag-theme-alpine${theme.palette.mode === "dark" ? "-dark" : ""}`}
        style={{ height: "100%", width: '100%' }}
    >
        <AgGridReact rowData={props.rowData}
                     columnDefs={props.columnDefs}
                     defaultColDef={defaultColDef}
                     onGridReady={gridReady}
                     onFirstDataRendered={autoSizeColumns}
                     gridOptions={{
                         onFilterChanged: filerChangedHandler
                     }
                     }

                     {...props.agGridProps}
        />
    </div>
};

export default DataViewGrid;