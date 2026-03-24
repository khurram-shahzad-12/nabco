import DataViewGrid from "../DataViewGrid/DataViewGrid";
import { Box,Button, Typography } from "@mui/material";

const OrderDetails = ({orderRowData,orderColDef,setGridApi,savePriorityValue}) => {
  return (
    <Box>{orderRowData.length>0?(<>
    <DataViewGrid
    rowData={orderRowData}
    columnDefs={orderColDef}
    agGridProps={{ domLayout: 'autoHeight' }}
    getGridApi={setGridApi}
  />
<Box sx={{display:"flex", justifyContent:"end", mt:2}}><Button variant="contained" sx={{ height: 50, width: 250, marginX:2 }} onClick={savePriorityValue}>Save Priority Weight</Button></Box></>):(<Typography variant="h5">No Order Found</Typography>)}   
</Box>    
  )
}

export default OrderDetails