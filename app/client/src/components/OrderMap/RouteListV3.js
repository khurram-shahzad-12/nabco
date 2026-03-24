import { Box, Typography, Grid, FormControl, InputLabel, Select, MenuItem, IconButton, Button } from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useState, useEffect } from "react";
import AddIcon from '@mui/icons-material/Add';

const RouteListV3 = ({ rowData, colDefs, onDragEnd, newRowData, availableVehicles=[], customVehicles = {}}) => {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [newVehicles, setNewVehicles] = useState([]);
  const [allVehiclesData, setAllVehiclesData] = useState({});

    useEffect(() => {
    const safeAvailableVehicles = Array.isArray(availableVehicles) ? availableVehicles : [];
    const currentVehicleNames = Object.keys(rowData || {});
    const existingNewVehicles = newVehicles.map(v => v.vehicleNo);
    const newVehiclesFromRowData = currentVehicleNames.filter(vehicleName => {
      const isNotInNewVehicles = !existingNewVehicles.includes(vehicleName);
      const isInAvailableVehicles = safeAvailableVehicles.some(av => 
        av && av.vehicleNo === vehicleName
      );
      return isNotInNewVehicles && isInAvailableVehicles;
    }).map(vehicleName => {
      const vehicleData = safeAvailableVehicles.find(av => av.vehicleNo === vehicleName);
      return {
        vehicleNo: vehicleName,
        distance: '0',
        rows: rowData[vehicleName]?.['0'] || [],
        capacity: vehicleData?.capacity || 0,
      };
    });

    if (newVehiclesFromRowData.length > 0) {
      setNewVehicles(prev => {
        const existingVehicleNos = prev.map(v => v.vehicleNo);
        const uniqueNewVehicles = newVehiclesFromRowData.filter(v => 
          !existingVehicleNos.includes(v.vehicleNo)
        );
        return [...prev, ...uniqueNewVehicles];
      });
    }
  }, [rowData, availableVehicles, newVehicles]);

   const getDroppableId = (vehicleNo, distance) => {
    if (vehicleNo === 'unassigned') return 'unassigned';
    return `${vehicleNo}::${distance}`;
  }

  const getCustomerId = (row) => row.id || row.customer_id || row.customerid || row.order_id;
  
  const getTotalWeight = (rows) => {
    return rows.reduce((sum, row) => sum + (row.order_weight || 0), 0);
  };
  const isSpiceDirect = (row) => row.cust_name === "Spice Direct";
 
  const getDeliveryTimeColor = (arrivalTime, isUnassigned = false) => {
    if (isUnassigned) return '#C71585';
    if (!arrivalTime || arrivalTime === "00:00") return '#FFC0CB';
    
    const timeToMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const arrivalMinutes = timeToMinutes(arrivalTime);
    
    if (arrivalMinutes >= 0 && arrivalMinutes < 12 * 60) {
      return '#FF0000';
    } else if (arrivalMinutes >= 12 * 60 && arrivalMinutes < 14 * 60) {
      return '#FFA500';
    } else if (arrivalMinutes >= 14 * 60 && arrivalMinutes < 18 * 60) {
      return '#ffff99';
    } else if (arrivalMinutes >= 18 * 60 && arrivalMinutes < 24 * 60) {
      return '#008000';
    } else {
      return '#C71585';
    }
  };


  const getAllVehicles = () => {
    const customVehiclesData = {};
    newVehicles.forEach(vehicle => {
      if (rowData && rowData[vehicle.vehicleNo]) {
        customVehiclesData[vehicle.vehicleNo] = { ...rowData[vehicle.vehicleNo] };
      } else {
        customVehiclesData[vehicle.vehicleNo] = {
          '0': vehicle.rows || []
        };
      }
    });
    const allVehicles = { ...rowData, ...customVehiclesData };
    return allVehicles;
  }

  const handleAddNewVehicle = () => {
    if (!selectedVehicle) return;
    const selectedVehicleData = availableVehicles.find(v => v.vehicleNo === selectedVehicle);
    const newVehicle = {
      vehicleNo: selectedVehicle,
      distance: '0',
      rows: [],
      capacity: selectedVehicleData?.capacity || 0,
    };
    setNewVehicles(prev => [...prev, newVehicle]);
    setSelectedVehicle('');
  }
  const getFilteredAvailableVehicles = () => {
    const safeAvailableVehicles = Array.isArray(availableVehicles) ? availableVehicles : [];
    return safeAvailableVehicles.filter(vehicle => 
      vehicle && vehicle.vehicleNo && !allVehiclesData[vehicle.vehicleNo]
    );
  };

  useEffect(() => {
    const updatedAllVehiclesData = getAllVehicles();
    setAllVehiclesData(updatedAllVehiclesData);
  }, [rowData, newVehicles]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Grid container spacing={2} style={{ height: "fit-content" }} wrap="nowrap">
        {newRowData && newRowData.length > 0 && (
          <Grid item style={{ width: "210px" }}>
            <Typography variant="h5" color="orange" gutterBottom>
              UnAssigned Routes (New) [{getTotalWeight(newRowData)} KG]
            </Typography>

            <Droppable droppableId="unassigned">
              {(provided) => (
                <Box 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    mb: 2,
                    p: 2,
                  }}
                >
                  {newRowData.map((row, index) => (
                    <Draggable 
                      key={`unassigned_${getCustomerId(row)}`} 
                      draggableId={`unassigned_${getCustomerId(row)}`} 
                      index={index}
                      isDragDisabled={isSpiceDirect(row)}
                    >
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{
                            mb: 1,
                            p: 1,
                            backgroundColor: snapshot.isDragging
                              ? "white"
                              : getDeliveryTimeColor(row.arrival_time, true),
                            borderBottom: 1,
                            borderColor: "divider",
                            "&:last-child": { borderBottom: 0 },
                            cursor: isSpiceDirect(row) ? "default" : "grab",
                            display: isSpiceDirect(row) ? 'none' : 'block',
                            color: 'black',
                            border:1, borderColor: 'white',
                          }}
                        >
                          <Typography variant="body1" fontWeight="medium">
                            {row.cust_name || "Name Not Found"}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Weight: {row.order_weight} KG
                          </Typography>
                        </Box>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </Grid>
        )}
        {Object.keys(allVehiclesData).length === 0 ? (
          <Grid item>
            <Typography variant="h5">No Route Data Found</Typography>
          </Grid>
        ) : (
          Object.entries(allVehiclesData).map(([vehicleNo, distanceGroups]) => (
            <Grid item key={vehicleNo} style={{ width: "210px" }}>
              <Typography variant="h6" gutterBottom>
                {vehicleNo}
              </Typography>

              {Object.entries(distanceGroups).map(([distance, vehicleRows]) => {
                const droppableId = getDroppableId(vehicleNo, distance);
                const totalWeight = vehicleRows.reduce(
                  (sum, row) => sum + (row.order_weight || 0),
                  0
                );
                const vehDistance = vehicleRows.reduce(
                  (sum, row) => sum + (row.distance || 0),
                  0
                );

                return (
                  <Box key={droppableId} sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography  sx={{ fontSize: "12px", fontWeight: 500 }}>
                        Departure Time:
                      </Typography>
                      <Typography  sx={{ fontSize: "12px", fontWeight: 500 }}>
                        {vehicleRows[0]?.departure_time || ""}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography  sx={{ fontSize: "12px", fontWeight: 500 }}>
                        Weight: {totalWeight} KG
                      </Typography>
                      <Typography  sx={{ fontSize: "12px", fontWeight: 500 }}>
                        Zone: {vehicleRows[0]?.zone || "Zone - new"}
                      </Typography>
                    </Box>
                    <Droppable droppableId={droppableId}>
                      {(provided) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          sx={{
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 1,
                            minHeight: "50px", 
                          }}
                        >
                          {vehicleRows.map((row, index) => (
                            <Draggable
                              key={`assigned_${getCustomerId(row)}`}
                              draggableId={`assigned_${getCustomerId(row)}`}
                              index={index}
                              isDragDisabled={isSpiceDirect(row)}
                            >
                              {(provided, snapshot) => (
                                <Box
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  sx={{
                                    p: 1,
                                    backgroundColor: snapshot.isDragging? "white" : getDeliveryTimeColor(row.arrival_time, false),
                                    borderBottom: 1,
                                    borderColor: "divider",
                                    "&:last-child": { borderBottom: 0 },
                                    cursor: isSpiceDirect(row) ? "default" : "grab",
                                    display: isSpiceDirect(row) ? 'none' : 'block',
                                    color: 'black',
                                    border:1, borderColor: 'white',
                                  }}
                                >
                                  <Typography variant="body2" fontWeight="medium">
                                    {row.cust_name || "Name Not Found"}
                                  </Typography>
                                  <Typography variant="body2">
                                    Weight: {row.order_weight} KG
                                  </Typography>
                                </Box>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </Box>
                      )}
                    </Droppable>
                  </Box>
                );
              })}
            </Grid>
          ))
        )}
        <Grid item style={{ width: "210px" }}>
        <Box sx={{p: 2, border: '1px dashed #ccc', borderRadius: 1}}>
          <Typography variant="h6" gutterBottom color='primary'>Add New Vehicle</Typography>
          <FormControl fullWidth size="small" sx={{mb:2}}>
            <InputLabel>Select Vehicle</InputLabel>
            <Select label = "Select Vehicle" 
            value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}>
              {getFilteredAvailableVehicles().map(vehicle => (
                <MenuItem key={vehicle.vehicleNo} value={vehicle.vehicleNo}>
                  {vehicle.vehicleNo} (Capacity: {vehicle.capacity} KG)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant = "outlined"
          startIcon = {<AddIcon />}
          onClick = {handleAddNewVehicle}
          disabled = {!selectedVehicle}
          fullWidth
          ></Button>
        </Box>
        </Grid>
      </Grid>
    </DragDropContext>
  );
};

export default RouteListV3;