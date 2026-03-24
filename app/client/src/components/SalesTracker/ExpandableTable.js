import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Table, TableContainer, TableHead, TableRow, TableCell, TableBody, IconButton, Collapse, Typography, Box } from '@mui/material';
import React, { useState } from 'react';

const ExpandableTable = ({ data, columns, expandableColumns, title, onRowClick, keyProp, renderExpandableContent }) => {
  const [openRow, setOpenRow] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleRowClick = (index, item) => {
    setOpenRow(openRow === index ? null : index);
    setSelectedItem(item);
    if (onRowClick) onRowClick(item);
  };

  return (
    <TableContainer><Table>
        <TableHead>
          <TableRow sx={{ bgcolor: "primary.main" }}>
            {columns.map((col, idx) => (
              <TableCell
                key={idx}
                align={col.align || "left"}
                sx={{ color: "black", fontWeight: "bold", fontSize: 16 }}
              >
                {col.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data?.map((item, index) => {
            const isOpen = openRow === index;
            return (
              <React.Fragment key={item[keyProp] || index}>
                <TableRow
                  hover
                  sx={{
                    "& > *": { borderBottom: "unset" },
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#131212ff" },
                  }}
                  onClick={() => handleRowClick(index, item)}
                >
                  {columns.map((col, colIndex) => (
                    <TableCell
                      key={colIndex}
                      align={col.align || "left"}
                      component={colIndex === 0 ? "th" : "td"}
                      scope="row"
                      sx={{
                        ...(col.cellStyle ? col.cellStyle(item) : {}),
                      }}
                    >
                      {colIndex === 0 && (
                        <IconButton size="small">
                          {isOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        </IconButton>
                      )}
                      {col.render ? col.render(item) : item[col.field]}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={columns.length}>
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 1 }}>
                        {renderExpandableContent ? (renderExpandableContent(item)) : (
                          <><Typography variant="subtitle1" gutterBottom component="div">
                            Monthly Details
                          </Typography>
                            <Table size="small" aria-label="monthly-data">
                              <TableHead>
                                <TableRow sx={{ bgcolor: "primary.main" }}>
                                  {expandableColumns?.map((col, idx) => (
                                    <TableCell
                                      key={idx}
                                      align={col.align}
                                      sx={{ color: "white", border: "1px solid white" }}
                                    >
                                      {col.header}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {item?.monthlySales?.map((monthly, idx) => (
                                  <TableRow key={`${monthly?.month}-${idx}`}>
                                    {expandableColumns.map((col, colIdx) => (
                                      <TableCell
                                        key={colIdx}
                                        align={col.align}
                                        sx={{ border: "1px solid white" }}
                                      >
                                        {col.render ? col.render(monthly) : monthly[col.field]}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table></>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ExpandableTable