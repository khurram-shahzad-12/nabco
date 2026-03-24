import { Box, Typography, Grid, Button } from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const RouteList = ({ rowData, colDefs, onDragEnd, newRowData }) => {
  const getDroppableId = (vehicleNo, distance) => {
    if (vehicleNo === 'unassigned') return 'unassigned';
    return `${vehicleNo}::${distance}`;
  }
  const getCustomerId = (row) => row.id || row.customer_id || row.customerid || row.order_id;
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {newRowData && newRowData.length > 0 && (
        <Box sx={{ mb: 4 }}><Typography variant="h5" color={'orange'}>UnAssigned Routes (New)</Typography>
          <Box
            sx={{
              p: 2,
              display: "grid",
              gridTemplateColumns: colDefs.map(col => col.width || '1fr').join(' '),
              gap: 1,
              backgroundColor: "green",
              borderTopLeftRadius: 1,
              borderTopRightRadius: 1,
              border: 1,
              borderBottom: 0,
              borderColor: "divider",
            }}
          >
            {colDefs.map((col) => (
              <Box key={col.field} display={'flex'} justifyContent={col.align === 'left' ? "flex-start" : 'center'}>
                <Typography variant="subtitle2" fontWeight="Bold">
                  {col.headerName}
                </Typography>
              </Box>
            ))}
          </Box>
          <Droppable droppableId="unassigned">
            {(provided) => (
              <Box ref={provided.innerRef}
                {...provided.droppableProps}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  mb: 2,
                  p: 2,
                }}
              >{
                  newRowData.map((row, index) => (
                    <Draggable key={`unassigned_${getCustomerId(row)}`} draggableId={`unassigned_${getCustomerId(row)}`} index={index}>
                      {(provided, snapshot) => (
                        <Box ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{
                            mb: 1,
                            p: 2,
                            display: "grid",
                            gridTemplateColumns: colDefs.map(col => col.width || '1fr').join(' '),
                            backgroundColor: snapshot.isDragging
                              ? "rgba(0, 0, 0, 0.05)"
                              : index % 2 === 0 ? "#2e3232" : "transparent",
                            borderBottom: 1,
                            borderColor: "divider",
                            "&:last-child": { borderBottom: 0 },
                          }}
                        >{
                            colDefs.map((col) => (
                              <Box key={col.field} display={"flex"} justifyContent={col.align === 'left' ? 'flex-start' : 'center'}>
                                <Typography>{row[col.field]}</Typography>
                              </Box>
                            ))
                          }</Box>
                      )}
                    </Draggable>
                  ))
                }{provided.placeholder}</Box>
            )}
          </Droppable>
        </Box>)}
      <Box>
        {Object.keys(rowData).length === 0 ? (
          <Typography variant="h5">No Route Data Found</Typography>
        ) : (
          Object.entries(rowData).map(([vehicleNo, distanceGroups]) => (
            <Box key={vehicleNo} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Vehicle Reg No: {vehicleNo}
              </Typography>
              {Object.entries(distanceGroups).map(([distance, vehicleRows]) => {
                const droppableId = getDroppableId(vehicleNo, distance);
                const totalWeight = vehicleRows.reduce(
                  (sum, row) => sum + (row.order_weight || 0),
                  0
                );
                const vehDistance = vehicleRows.reduce((sum, row) => sum + (row.distance || 0), 0);

                return (
                  <Box key={droppableId} sx={{ mb: 3, width: "100%" }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body1">
                        Distance: {vehDistance.toFixed(2)} miles
                      </Typography> <Typography>{vehicleRows[0]?.zone || ""}</Typography>
                      <Typography variant="body1">
                        Total Order Weight: {totalWeight} KG
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        p: 2,
                        display: "grid",
                        gridTemplateColumns: colDefs.map(col => col.width || '1fr').join(' '),
                        gap: 1,
                        backgroundColor: "green",
                        borderTopLeftRadius: 1,
                        borderTopRightRadius: 1,
                        border: 1,
                        borderBottom: 0,
                        borderColor: "divider",
                      }}
                    >
                      {colDefs.map((col) => (
                        <Box key={col.field} display={'flex'} justifyContent={col.align === 'left' ? "flex-start" : 'center'}>
                          <Typography variant="subtitle2" fontWeight="Bold">
                            {col.headerName}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Droppable droppableId={droppableId}>
                      {(provided) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          sx={{
                            border: 1,
                            borderTop: 0,
                            borderColor: "divider",
                            borderBottomLeftRadius: 1,
                            borderBottomRightRadius: 1,
                          }}
                        >
                          {vehicleRows.map((row, index) => (
                            <Draggable
                              key={`assigned_${getCustomerId(row)}`}
                              draggableId={`assigned_${getCustomerId(row)}`}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <Box
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  sx={{
                                    p: 2,
                                    display: "grid",
                                    gridTemplateColumns: colDefs.map(col => col.width || '1fr').join(' '),
                                    gap: 1,
                                    backgroundColor: snapshot.isDragging
                                      ? "rgba(0, 0, 0, 0.05)"
                                      : index % 2 === 0 ? "#2e3232" : "transparent",
                                    borderBottom: 1,
                                    borderColor: "divider",
                                    "&:last-child": { borderBottom: 0 },
                                  }}
                                >
                                  {colDefs.map((col) => (
                                    <Box key={col.field} display={"flex"} justifyContent={col.align === 'left' ? 'flex-start' : 'center'}>
                                      <Typography variant="body2">
                                        {row[col.field]}
                                      </Typography>
                                    </Box>
                                  ))}
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
            </Box>
          ))
        )}
      </Box>
    </DragDropContext>
  );
};

export default RouteList;
