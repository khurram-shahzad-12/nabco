import React from "react";
import { Box, Typography, TextField, Card, CardContent } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/lab";
import AdapterDateFns from "@mui/lab/AdapterDateFns";

const DateRangeFilter = ({ startDate, endDate, onDateChange }) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "nowrap", gap: 1 }}
        >
          <Typography>From</Typography>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(date) => onDateChange(date, "start")}
              maxDate={endDate || undefined}
              inputFormat="dd/MM/yyyy"
              renderInput={(params) => (
                <TextField {...params} size="small" />
              )}
            />
          </LocalizationProvider>
          <Typography>To</Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(date) => onDateChange(date, "end")}
              minDate={startDate || undefined}
              inputFormat="dd/MM/yyyy"
              renderInput={(params) => (
                <TextField {...params} size="small" />
              )}
            />
          </LocalizationProvider>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DateRangeFilter;