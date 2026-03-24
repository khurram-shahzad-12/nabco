import { useEffect, useState, useRef } from 'react';
import axiosDefault from '../../components/axiosDefault/axiosDefault';
import { FormControl, Select, InputLabel, MenuItem, TextField, Button, Tab, Grid } from "@mui/material";
import { TabList, TabContext, TabPanel } from '@mui/lab';
import DatePicker from '@mui/lab/DatePicker';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import { defaultSnackState, fetchAllEntriesAndSetRowData, getColumnDefs, updateFieldsData } from '../../components/formFunctions/FormFunctions';
import displaySnackState from '../../components/customisedSnackBar/DisplaySnackState';
import CustomConfirmModal from '../../components/CustomConfirmModal/CustomConfirmModal';
import CustomisedSnackBar from '../../components/customisedSnackBar/CustomisedSnackBar';
import OrderDetails from '../../components/OrderMap/OrderDetails';
import RouteList from '../../components/OrderMap/RouteList';
import RouteMap from '../../components/OrderMap/RouteMap';
import RouteSetting from '../../components/OrderMap/RouteSetting';
import moment from 'moment-timezone';
import RouteListV3 from '../../components/OrderMap/RouteListV3';

const OrderMap = () => {
  const axios = axiosDefault()
  const [routes, setRoutes] = useState([]);
  const [directions, setDirections] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startOfDate, setStartOfDate] = useState(new Date());
  const [endOfDate, setEndOfDate] = useState(new Date());
  const [sendingData, setSendingData] = useState(false);
  const [snackState, setSnackState] = useState(defaultSnackState);
  const [vehRowData, setVehRowData] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [value, setValue] = useState('1');
  const [rowData, setRowData] = useState([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState({ open: false });
  const [miles, setMiles] = useState(650);
  const [maxOrders, setMaxOrders] = useState(20);
  const [routeLength, setRouteLength] = useState(12);
  const [orderRowData, setOrderRowData] = useState([]);
  const [unLoadingTime, setUnLoadingTime] = useState(15);
  const [routeGroup, setRouteGroup] = useState({});
  const [newRoute, setNewRoute] = useState([]);
  const [reload, setReload] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [isDisAbled, setIsDisAbled] = useState(false);
  const mapRef = useRef(null);

  const DVR_API_NAME = '/driver/vehicle';
  const ODR_API_NAME = '/invoice/routeorders';
  const DVR_API_CAPACITY = '/driver/vehicle/capacity';
  const DVR_API_AVAIL = '/driver/vehicle/availability';
  const INV_API_PRIORITY = '/invoice/updateorderpriority';

  const handleChange = (event, newValue) => { setValue(newValue); }
  const handleReload = () => { setReload(true) };
  const handleDateChange = (newDate) => {
    if(!newDate) return;
    setSelectedDate(newDate);
    const selected = moment(newDate).utc(true);
    const getStartDate = selected.startOf("day").toISOString();
    const getEndDate = selected.endOf("day").toISOString();
    setStartOfDate(getStartDate);
    setEndOfDate(getEndDate);
  };
  const fetchRoutes = async () => {
    try {
      const resp = await axios.get(`${process.env.REACT_APP_URL_ROOT}/api/ordermap?start_date=${startOfDate}&end_date=${endOfDate}`);
      if (resp.data.length > 0) {
        setRouteGroup(resp.data[0]);
        const raw_routes = resp.data[0].vehicle_routes;
        const row_data = raw_routes && raw_routes.flatMap((r, rIndex) => (
          r.stops.map((s, sIndex) => ({
            id: `${rIndex}+${sIndex}`,
            veh_reg_no: r.vehicle_id.name,
            distance_veh_km: r.distance_veh_km,
            total_weight_kg_veh: r.total_weight_kg_veh,
            cust_name: s.type === 'depot' ? "Spice Direct" : s.customer_name,
            cust_address: s.address,
            arrival_time: s.arrival_time,
            departure_time: s.departure_time,
            distance: s.distance,
            travel_time: s.travel_time,
            order_weight: s.order_weight,
            veh_reg_id: r.vehicle_id._id,
            cust_loc: s.location,
            orderid: s.order_id || "",
            customerid: s.customer_id || "",
            original_order_ids: s.original_order_ids || [],
            zone: r.zone,
          }))
        ));
        const groupedRowData = row_data.reduce((acc, row) => {
          if (!acc[row.veh_reg_no]) {
            acc[row.veh_reg_no] = {};
          }
          if (!acc[row.veh_reg_no][row.distance_veh_km]) {
            acc[row.veh_reg_no][row.distance_veh_km] = [];
          }
          acc[row.veh_reg_no][row.distance_veh_km].push(row);
          return acc;
        }, {});
        setRowData(groupedRowData);
        setRoutes(raw_routes);
        fetchUnAssignedRoute();
      } else { setRoutes([]); setNewRoute([]); setSelectedRouteId(""); setRowData([]); displaySnackState(`No Routes found`, "error", setSnackState) };
    } catch (error) {
      console.error("Error fetching routes:", error);
      displaySnackState(`Failed to load invoices list - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
    }
  };
  const fetchOrders = async () => {
    fetchAllEntriesAndSetRowData(ODR_API_NAME, { params: { delivery_day_start: startOfDate, delivery_day_end: endOfDate } }, setSendingData, setOrderRowData, setSnackState);
  }
  const fetchUnAssignedRoute = async () => {
    try {
      setSendingData(true);
      const resp = await axios.post(`${process.env.REACT_APP_URL_ROOT}/api/ordermap?start_date=${startOfDate}&end_date=${endOfDate}`);
      setNewRoute(resp.data); setSendingData(false);

    } catch (error) {
      console.error("Error fetch unAssignedRoute", error); setSendingData(false);
      displaySnackState(`Failed to load unAssinged Route - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
    }
  }
  const generateOrderRoute = async () => {
    try {
      setSendingData(true)
      const formatedDate = selectedDate?.toISOString().split('T')[0];
      const body = { invoice_date: formatedDate, miles, maxOrders, routeLength, unLoadingTime }
      const resp = await axios.post(`${process.env.REACT_APP_ROUTE_URL_ROOT}/api/v1/routes/getallroutesolutions/`, body);
      fetchRoutes();
      fetchAllVehicles();
      displaySnackState("Routes generated successfully!", "success", setSnackState);
      setSendingData(false)
    } catch (error) {
      console.log("Error generating routes", error);
      setSendingData(false)
      displaySnackState(`Failed to generate routes - ${error.response && error.response.data ? error.response.data.error : error.message || "internal server error"}`, "error", setSnackState);
    }
  }
  useEffect(() => {
    fetchRoutes();
    fetchOrders();
  }, [endOfDate]);

  useEffect(() => {
    const handleMapLocation = () => {
      if (selectedRouteId) {
        const get_selected_route = routes.find(route => route.vehicle_id._id == selectedRouteId);
        let check_stops = []
        get_selected_route.stops.forEach(stop => {
          if (!stop.location) { displaySnackState(`missing map location: ${stop.customer_name}`, 'error', setSnackState); check_stops.push(stop) }
        })
        if (check_stops?.length > 0) { setDirections(""); setSelectedRoute(""); return; }
        setSelectedRoute(get_selected_route);
        setDirections("");

        const waypoints = get_selected_route.stops.filter(stop => stop.type === 'delivery').map(stop => ({
          location: {
            lat: parseFloat(stop.location.split(',')[0]), lng: parseFloat(stop.location.split(',')[1])
          }, stopover: true,
        }));
        if (waypoints.length > 0) {
          const origin = get_selected_route.stops[0].location;
          const destination = get_selected_route.stops[get_selected_route.stops.length - 1].location;

          const directionService = new window.google.maps.DirectionsService();
          directionService.route({
            origin: {
              lat: parseFloat(origin.split(',')[0]), lng: parseFloat(origin.split(',')[1])
            },
            destination: {
              lat: parseFloat(destination.split(',')[0]), lng: parseFloat(destination.split(',')[1])
            },
            waypoints: waypoints,
            optimizeWaypoints: true,
            travelMode: window.google.maps.TravelMode.DRIVING
          }, (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              setDirections(result);
              const bounds = new window.google.maps.LatLngBounds();
              const route = result.routes[0];

              route.legs.forEach(leg => {
                bounds.extend(leg.start_location)
                bounds.extend(leg.end_location);
              });
              if (mapRef.current) {
                mapRef.current.fitBounds(bounds);
              }
            } else {
              console.log(`Direction request failed: ${status}`)
            }
          })
        }
      } else { setDirections(""); console.log("else condition") }
    };
    handleMapLocation();
  }, [selectedRouteId])

  const randomColorGenerator = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) { color += letters[Math.floor(Math.random() * 16)]; }
    return color;
  }
  const legs = directions?.routes?.[0]?.legs ?? [];

  const fetchAllVehicles = () => {
    fetchAllEntriesAndSetRowData(DVR_API_NAME, null, setSendingData, setVehRowData, setSnackState);
  }

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    const isUnassigned = (id) => id === 'unassigned';
    const parseDroppableId = (id) => {
      if (isUnassigned(id)) return { type: "unassigned" };
      const [vehicleNo, distance] = id.split("::");
      return { vehicleNo, distance, type: "assigned" };
    }
    const sourceGroup = parseDroppableId(source.droppableId);
    const destGroup = parseDroppableId(destination.droppableId);

    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const newAssigned = JSON.parse(JSON.stringify(rowData));
    const newUnAssigned = [...newRoute];
    let movedItem;
    if (sourceGroup.type === 'unassigned') {
      [movedItem] = newUnAssigned.splice(source.index, 1);
    } else {
      let targetSourceGroup;
      if (!newAssigned[sourceGroup.vehicleNo] || !newAssigned[sourceGroup.vehicleNo][sourceGroup.distance]) {
        console.log(`source group path missing: ${sourceGroup}`); return;
      }
      targetSourceGroup = newAssigned[sourceGroup.vehicleNo][sourceGroup.distance]
      movedItem = targetSourceGroup.splice(source.index, 1)[0];
    }
    if (destGroup.type === 'assigned' && source.droppableId !== destination.droppableId) {
      movedItem = {
        ...movedItem,
        veh_reg_no: destGroup.vehicleNo,
      }
    } else { movedItem = { ...movedItem, veh_reg_no: "Not Assigned" } }
    if (destGroup.type === 'unassigned') {
      newUnAssigned.splice(destination.index, 0, movedItem)
    } else {
      if (!newAssigned[destGroup.vehicleNo]) {
        newAssigned[destGroup.vehicleNo] = {'0':[]}
      }
      if (!newAssigned[destGroup.vehicleNo][destGroup.distance]) {
        newAssigned[destGroup.vehicleNo][destGroup.distance] = [];
      }
      newAssigned[destGroup.vehicleNo][destGroup.distance].splice(destination.index, 0, movedItem);
    }
    setRowData(newAssigned);
    setNewRoute(newUnAssigned);
  }
  const checkboxColumnDef = { headerName: "", checkboxSelection: true, headerCheckboxSelection: true, headerCheckboxSelectionFilteredOnly: true, filter: false, minWidth: 60, maxWidth: 60 }
  const colData = [
    {
      field: "veh_reg_no",
      label: "Vehicle No",
      type: "textfield",
      gridProps: { width: "120px" },
      textFieldProps: {
        required: true,
        type: "text",
        autoFocus: true
      }
    },
    {
      field: "cust_name",
      label: "Customer Name",
      type: "textfield",
      gridProps: { width: "300px", align: "left" },
      textFieldProps: {
        type: "text",
        autoFocus: true,
        required: true,
      }
    },
    {
      field: "cust_address",
      label: "Customer Address",
      type: "textfield",
      gridProps: { width: "300px", align: "left" },
      textFieldProps: {
        type: "text",
        autoFocus: true,
        required: true,
      }
    },
    {
      field: "arrival_time",
      label: "Arrival Time",
      type: "textfield",
      // gridProps: { width: "100px" },
      textFieldProps: {
        type: "text",
        autoFocus: true,
        required: true,
      }
    },
    {
      field: "travel_time",
      label: "Travel Time",
      type: "textfield",
      textFieldProps: {
        type: "text",
        autoFocus: true,
        required: true,
      }
    },
    {
      field: "order_weight",
      label: "Order Weight(KG)",
      type: "textfield",
      textFieldProps: {
        type: "text",
        autoFocus: true,
        required: true,
      }
    },
    {
      field: "distance",
      label: "Distance Miles",
      type: "textfield",
      textFieldProps: {
        type: "text",
        autoFocus: true,
        required: true,
      }
    },
    {
      field: "departure_time",
      label: "Departure Time",
      type: "textfield",
      textFieldProps: {
        type: "text",
        autoFocus: true,
        required: true,
      }
    },
  ];
  const vehiclesData = [
    {
      field: 'name',
      headerName: 'Name',
    },
    {
      field: 'capacity',
      headerName: 'Capacity (KG)',
      editable: true,
      valueSetter: (params) => {
        const newValue = parseFloat(params.newValue);
        if (!isNaN(newValue)) {
          params.data.capacity = newValue;
          return true;
        }
        return false
      },
    },
    {
      field: 'availability',
      headerName: 'Availability',
    },
    {
      field: 'status',
      headerName: 'Status',
    },
  ]

  const orderColDef = [
    {
      field: "sale_number",
      headerName: "Invoice Number",
    },
    {
      field: "customer_name",
      headerName: "Customer Name",
    },
    {
      field: "address",
      headerName: "Customer Address",
    },
    {
      field: "city",
      headerName: "City",
    },
    {
      field: "priority_value",
      headerName: "Priority Value",
      editable: true,
      valueSetter: (params) => {
        const newValue = parseFloat(params.newValue);
        if (!isNaN(newValue)) {
          params.data.priority_value = newValue;
          return true;
        }
        return false;
      }
    },
  ]
  const rowSelectionChanged = event => {
    setSelectedItems(event.api.getSelectedNodes().map(node => node.data._id));
  };
  const changeAvailability = () => {
    setConfirmDialogOpen({
      open: true,
      callbacks: {
        yes: () => changeVehAvailability("available", selectedItems),
        no: () => changeVehAvailability('notavailable', selectedItems),
        cancel: () => setConfirmDialogOpen({ open: false })
      }
    });
  }

  const changeVehAvailability = async (status, ids) => {
    setConfirmDialogOpen({ open: false });
    const updatedValue = { status, ids }
    updateFieldsData(DVR_API_AVAIL, updatedValue, setSendingData, setSnackState);
    fetchAllVehicles();
  }

  const updateFields = (updatedData) => {
    updateFieldsData(DVR_API_CAPACITY, updatedData, setSendingData, setSnackState);
    fetchAllVehicles();
  }
  const saveCapacity = async () => {
    try {
      if (!gridApi || !vehRowData) {
        alert("Grid API not ready, please wait before trying again");
      } else {
        const finalItemsList = []
        gridApi.api.stopEditing();
        gridApi.api.forEachNode(node => {
          const currentItemData = { ...node.data };
          finalItemsList.push({
            _id: currentItemData._id,
            capacity: currentItemData.capacity,
          })
        });
        await updateFields(finalItemsList)
      }
    } catch (error) {
      console.log("error", error);
      displaySnackState(`Failed to update - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
    }
  }

  const updatePriorityField = async (updateData) => {
    updateFieldsData(INV_API_PRIORITY, updateData, setSendingData, setSnackState);
    fetchOrders()
  }

  const savePriorityValue = async () => {
    try {
      if (!gridApi || !orderRowData) {
        alert("Grid API not ready, please wait before trying again");
      } else {
        const listItems = [];
        gridApi.api.stopEditing();
        gridApi.api.forEachNode(node => {
          const currentItems = { ...node.data };
          listItems.push({
            _id: currentItems._id,
            priority_value: currentItems.priority_value,
          })
        });
        await updatePriorityField(listItems)
      }
    } catch (error) {
      console.log("Error", error);
      displaySnackState(`Failed to save - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
    }
  }
  const saveDragChanges = async () => {
    const groupedRoutes = {};
    Object.entries(rowData).forEach(([vehicleName, routes]) => {
      Object.entries(routes).forEach(([distance, stops]) => {
        stops.forEach((stop) => {
          const stopObj = {
            type: stop.cust_name === "Spice Direct" ? "depot" : "delivery",
            customer_name: stop.cust_name,
            address: stop.cust_address,
            location: stop.cust_loc,
            arrival_time: stop.arrival_time,
            travel_time: stop.travel_time,
            distance: stop.distance,
            departure_time: stop.departure_time,
            order_weight: stop.order_weight,
            order_id: stop.orderid ? stop.orderid : stop.order_id,
            customer_id: stop.customerid ? stop.customerid : stop.customer_id,
            original_order_ids: stop.original_order_ids || [],
          };
          if (!groupedRoutes[vehicleName]) {
            groupedRoutes[vehicleName] = [];
          }

          groupedRoutes[vehicleName].push(stopObj);
        });
      });
    });
    const updated_vehicle_routes = Object.entries(groupedRoutes).map(([vehicle_id, stops]) => ({
      vehicle_id,
      stops,
    }));
    const exist_route = routeGroup.vehicle_routes;
    let merged = exist_route.map((exist) => {
      const match = updated_vehicle_routes.find((updated) => updated.vehicle_id === exist.vehicle_id.name);
      return {
        vehicle_id: exist.vehicle_id._id,
        distance_veh_km: exist.distance_veh_km,
        total_weight_kg_veh: exist.total_weight_kg_veh,
        zone: exist.zone || 0,
        stops: match ? match.stops : []
      }
    });
    const updated_route_id = routeGroup._id;
    const unAssignedRouteIDs = [];
    newRoute.map((route) => { unAssignedRouteIDs.push(route.order_id) });

    const existingZones = exist_route.map(route => route.zone).filter(zone => zone !== undefined && zone !== null);
  let nextZone = 0;
  if (existingZones.length > 0) {
    const zoneNumbers = existingZones.map(zone => {
      if (typeof zone === 'string') {
        const match = zone.match(/Zone - (\d+)/);
        return match ? parseInt(match[1]) : 0;
      }
      return typeof zone === 'number' ? zone : 0;
    });
    const maxZone = Math.max(...zoneNumbers);
    nextZone = maxZone + 1;
  }

    const newVehiclesToAdd = [];
    updated_vehicle_routes.forEach((updatedRoute)=>{
      const vehicleExists = exist_route.some(exist => exist.vehicle_id.name === updatedRoute.vehicle_id);
      if(!vehicleExists) {
        const vehicleData = availableVehicles.find(veh => veh.vehicleNo === updatedRoute.vehicle_id);
        if(vehicleData){
          const totalWeight = updatedRoute.stops.reduce((sum, stop) => sum + (stop.order_weight || 0), 0);
          const totalDistance = updatedRoute.stops.reduce((sum, stop) => sum + (stop.distance || 0), 0);
          const assignedZone = `Zone - ${nextZone}`;
          nextZone++;
          newVehiclesToAdd.push({
          vehicle_id: vehicleData._id || updatedRoute.vehicle_id,
          distance_veh_km: totalDistance,
          total_weight_kg_veh: totalWeight,
          zone: assignedZone,
          stops: updatedRoute.stops
        });
        }
      }
    })
    merged.push(...newVehiclesToAdd);
    try {
      const resp = await axios.put(`${process.env.REACT_APP_URL_ROOT}/api/ordermap/${updated_route_id}`, { merged, unAssignedRouteIDs });
      if (resp.status == 200) { displaySnackState(`saved successfully`, "success", setSnackState); fetchRoutes(); } else { displaySnackState(`Failed to saved, Try Again`, "error", setSnackState); }
    } catch (error) {
      console.log(error)
    }
  }
  useEffect(() => { fetchAllVehicles() }, []);
  useEffect(() => {
    if (reload) { fetchRoutes(); fetchUnAssignedRoute(); fetchOrders(); fetchAllVehicles(); setReload(false) }
  }, [reload])
  useEffect(() => {
    const checkUKTime = () => {
      const currentMoment = moment.tz('Europe/London');
      const ukHour = currentMoment.hour();
      const shouldDisabled = (ukHour >= 20 || ukHour < 12);
      setIsDisAbled(shouldDisabled);
    }
    checkUKTime();
    const interval = setInterval(checkUKTime, 120000);
    return () => clearInterval(interval)
  }, [])
  const dvrColDefs = [checkboxColumnDef, ...vehiclesData]
  const colDefs = [...getColumnDefs(colData)];
  const availableVehicles = vehRowData.map((veh)=>{
    return{
      vehicleNo: veh.name,
      capacity: veh.capacity,
      _id: veh._id,
    }
  });
  return (
    <TabContext value={value}>
      <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
      <Grid container justifyContent='space-between' sx={value === "5" ?{boxSizing:'border-box', maxWidth: "80%", overflow:"hidden"}: {}} >
        {value === "1" && (
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">Select Vehicle Routes</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={selectedRouteId}
                label="Select Vehicle Route"
                onChange={(e) => setSelectedRouteId(e.target.value)}
              >
                {routes.length === 0 ? (<MenuItem disabled>No Route Found</MenuItem>) : (
                  routes.map((route, index) => (
                    <MenuItem value={route.vehicle_id._id} key={index}>{route.vehicle_id.name} - {route.stops.filter(stp => stp.type === "delivery").length} Stops</MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>)}
        <Grid sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'center' }} item xs={12} md={6}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            <Tab label="Route Map" value="1" />
            <Tab label="Route List" value="2" />
            <Tab label="Route Setting" value="3" />
            <Tab label="Order Setting" value="4" />
            <Tab label="Route List (V3)" value="5" />
          </TabList>
        </Grid>
        {value !== "1" && (
          // <Grid item xs={12} sm={6} md={1.5}><Button variant="contained" sx={{ height: 50 }} onClick={generateOrderRoute} disabled={sendingData || isDisAbled}>{sendingData ? "Please Wait" : "Generate Route"}</Button></Grid>)}
          <Grid item xs={12} sm={6} md={1.5}><Button variant="contained" sx={{ height: 50 }} onClick={generateOrderRoute} disabled >{sendingData ? "Please Wait" : "Generate Route"}</Button></Grid>)}
        {(value === "2" || value === "5") && (
          <Grid item xs={12} sm={6} md={1.4}><Button variant="contained" onClick={saveDragChanges} sx={{ height: 50 }}>Save Changes</Button></Grid>)}
        <Grid item xs={12} sm={6} md={value === "2" ? 0.8 : 1.2}><Button variant="contained" onClick={handleReload} fullWidth sx={{ height: 50 }}>Reload</Button></Grid>
        <Grid item xs={12} sm={6} md={2}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Select Date"
              value={selectedDate}
              onChange={newDate => handleDateChange(newDate)}
              inputFormat="dd/MM/yyyy"
              renderInput={(params) => <TextField {...params} />}
            />
          </LocalizationProvider>
        </Grid>
      </Grid>
      <CustomConfirmModal open={confirmDialogOpen.open} callbacks={confirmDialogOpen.callbacks} message={"Vehicle is available for delivery Click 'YES' for available and  'No' for not available"} />
      <TabPanel value='1'>
        <RouteMap
          randomColorGenerator={randomColorGenerator}
          selectedRoute={selectedRoute}
          legs={legs}
        />
      </TabPanel>
      <TabPanel value='2'>
        <RouteList
          rowData={rowData}
          colDefs={colDefs}
          onDragEnd={handleDragEnd}
          newRowData={newRoute}
        />
      </TabPanel>
      <TabPanel value='3'>
        <RouteSetting
          vehRowData={vehRowData}
          dvrColDefs={dvrColDefs}
          maxOrders={maxOrders}
          setMaxOrders={setMaxOrders}
          miles={miles}
          setMiles={setMiles}
          setGridApi={setGridApi}
          routeLength={routeLength}
          setRouteLength={setRouteLength}
          saveCapacity={saveCapacity}
          changeAvailability={changeAvailability}
          rowSelectionChanged={rowSelectionChanged}
          unLoadingTime={unLoadingTime}
          setUnLoadingTime={setUnLoadingTime}
        />
      </TabPanel>
      <TabPanel value='4'>
        <OrderDetails
          orderColDef={orderColDef}
          orderRowData={orderRowData}
          setGridApi={setGridApi}
          savePriorityValue={savePriorityValue} />
      </TabPanel>
      <TabPanel value='5'>
        <RouteListV3
          rowData={rowData}
          colDefs={colDefs}
          onDragEnd={handleDragEnd}
          newRowData={newRoute}
          availableVehicles={availableVehicles}
        />
      </TabPanel>
    </TabContext>
  )
}

export default OrderMap
