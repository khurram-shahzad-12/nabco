import DataViewGrid from "../DataViewGrid/DataViewGrid";
import { Box,Grid,TextField,Button } from "@mui/material";

const RouteSetting = ({vehRowData,dvrColDefs,rowSelectionChanged,maxOrders,miles,setMiles,setMaxOrders,setGridApi,routeLength,setRouteLength,saveCapacity,changeAvailability,unLoadingTime,setUnLoadingTime}) => {
  return (
    <><Box style={{ width: '100%' }}>
    <DataViewGrid
      rowData={vehRowData}
      columnDefs={dvrColDefs}
      agGridProps={{
        domLayout: 'autoHeight',
        rowSelection: 'multiple',
        checkboxSelection: true,
        suppressRowClickSelection: true,
        onSelectionChanged: rowSelectionChanged
      }}
      getGridApi={setGridApi}
    />
  </Box>
  <Grid container sx={{mt:3}} spacing={1}>
  <Grid item xs={12} sm={1.5}>
    <TextField
      required={false}
      type='number'
      label="max Miles/vehicle"
      value={miles}
      onChange={(e)=>setMiles(e.target.value)}
    />
  </Grid>
  <Grid item xs={12} sm={1.5}>
    <TextField
      required={false}
      type='number'
      label="max order/vehicle"
      value={maxOrders}
      onChange={(e)=>setMaxOrders(e.target.value)}
    />
  </Grid>
  <Grid item xs={12} sm={1.7}>
    <TextField
      required={false}
      type='number'
      label="max route hour/vehicle"
      value={routeLength}
      onChange={(e)=>setRouteLength(e.target.value)}
    />
  </Grid>
  <Grid item xs={12} sm={1.7}>
    <TextField
      required={false}
      type='number'
      label="UnLoading Time/Min"
      value={unLoadingTime}
      onChange={(e)=>setUnLoadingTime(e.target.value)}
    />
  </Grid>
    <Grid item xs={12} sm={2.5}><Button variant="contained" sx={{ height: 50, width: 200, marginX:1}} onClick={changeAvailability}>Change Availability</Button></Grid>
    <Grid item xs={12} sm={2.5}><Button variant="contained" sx={{ height: 50, width: 200, marginX:1}} onClick={saveCapacity}>Save Capacity</Button></Grid>
  </Grid></>
  )
}

export default RouteSetting