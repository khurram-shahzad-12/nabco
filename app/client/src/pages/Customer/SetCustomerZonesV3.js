import React, {useEffect, useState} from 'react';

import displaySnackState from "../../components/customisedSnackBar/DisplaySnackState";
import CustomisedSnackBar from "../../components/customisedSnackBar/CustomisedSnackBar";
import {
    currentUserHasPermissions,
    defaultSnackState,
    fetchAllEntriesAndSetRowData,
    formatWeightToString, getTotalItemsWeightInGrams, momentFormat
} from "../../components/formFunctions/FormFunctions";

import {Button, Grid, Input, TextField} from "@mui/material";

import axiosDefault from "../../components/axiosDefault/axiosDefault";
import {URL_API, URL_ROOT} from "../../configs/config";
import {DragDropContext, Draggable, Droppable} from "react-beautiful-dnd";
import Card from "@mui/material/Card";
import AdapterDateFns from "@mui/lab/AdapterDateFns";
import DatePicker from "@mui/lab/DatePicker";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import moment from "moment";
import _ from "lodash";

const API_NAME = '/customer';

export const SetCustomerZonesV3 = () => {
    const [sendingData, setSendingData] = useState(false);
    const [selectedDate, setSelectedDate] = useState(moment(new Date()));
    const [zonesData, setZonesData] = useState([]);
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [allCustomersData, setAllCustomersData] = useState([]);
    const [customerZoneMappings, setCustomerZoneMappings] = useState({});
    const [availableCustomers, setAvailableCustomers] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [mappedCustomersFilterValue, setMappedCustomersFilterValue] = useState({});
    const [removedCustomers, setRemovedCustomers] = useState([]);
    const requiredWritePermissions = [process.env.REACT_APP_WRITE_CUSTOMER_ZONES_CLAIM];

    const onDateChange = newDate => {
        setSelectedDate(moment(newDate));
    };

    const fetchZones = () => {
        fetchAllEntriesAndSetRowData("/zone", null, setSendingData, setZonesData, setSnackState);
    };

    const fetchInvoices = () => {
        fetchAllEntriesAndSetRowData("/invoice", {params: {delivery_day_start: selectedDate.format(momentFormat), delivery_day_end: selectedDate.format(momentFormat), in_person: false}}, setSendingData, setInvoices, setSnackState);
    };
    
    const fetchAllItems = () => {
        fetchZones();
        fetchInvoices();
        fetchAllEntriesAndSetRowData(API_NAME, null, setSendingData, setAllCustomersData, setSnackState);
    };

    useEffect(() => {
        fetchAllItems();
    }, []);

    useEffect(() => {
        fetchAllItems();
    }, [selectedDate]);

    useEffect(() => {
        getCustomersForZoneAndDay();
    }, [allCustomersData, zonesData, invoices]);

    const saveChanges = () => {
        const API_UPDATE_ZONE_DELIVERY = "/updateCustomerZoneDelivery";
        const updatedCustomers = [];
        const zoneKeys = Object.keys(customerZoneMappings);

        zoneKeys.forEach(zoneID => {
            customerZoneMappings[zoneID].forEach((customer, index) => {
                let newZones = [...customer.zones];
                newZones[selectedDate.day()] = zoneID;
                let delivery_order = [...customer.delivery_order];
                delivery_order[selectedDate.day()] = index + 1;

                updatedCustomers.push({
                    _id: customer._id,
                    zones: newZones,
                    delivery_order: delivery_order
                });
            });
        });
        const payload = {
            updatedCustomers: updatedCustomers,
            removedCustomers: removedCustomers
        }
        axiosDefault().post(URL_ROOT + URL_API + API_NAME + API_UPDATE_ZONE_DELIVERY, payload)
            .then(response => {
                displaySnackState("Successfully updated", "success", setSnackState);
                setRemovedCustomers([]);
            })
            .catch(error => {
                console.error(error);
                displaySnackState(`Failed to update - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
            })
            .finally(() => {
                fetchAllItems();
            })
    };

    const findCustomerByID = id => {
        return allCustomersData.find(customer => customer._id.toString() === id);
    };

    const reorder = (list, startIndex, endIndex) => {
        const result = _.cloneDeep(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        return result;
    };

    const handleOnDragEnd = result => {
        const { source, destination, draggableId } = result;

        if (!destination) {
            return;
        }

        // Sorting in same list
        if (source.droppableId === destination.droppableId && destination.droppableId !== "Unmapped") {
            //rearrange mapped customers accordingly
            const items = reorder(
                customerZoneMappings[destination.droppableId],
                source.index,
                destination.index
            );
            const newMapping = _.cloneDeep(customerZoneMappings);
            newMapping[source.droppableId] = items;
            setCustomerZoneMappings(newMapping);
        } else if(source.droppableId !== destination.droppableId && source.droppableId !== "Unmapped" && destination.droppableId !== "Unmapped") {//moving from different lists and not unmapped
            const newDestinationCustomers = _.cloneDeep(customerZoneMappings[destination.droppableId]);
            newDestinationCustomers.splice(destination.index, 0, findCustomerByID(draggableId));

            const newSourceCustomers = _.cloneDeep(customerZoneMappings[source.droppableId]);
            newSourceCustomers.splice(source.index, 1);

            const newMapping = _.cloneDeep(customerZoneMappings);
            newMapping[source.droppableId] = newSourceCustomers;
            newMapping[destination.droppableId] = newDestinationCustomers;
            setCustomerZoneMappings(newMapping);
        } else if(source.droppableId !== destination.droppableId && source.droppableId === "Unmapped") {//unmapped to mapped
            const newDestinationCustomers = _.cloneDeep(customerZoneMappings[destination.droppableId]);
            newDestinationCustomers.splice(destination.index, 0, findCustomerByID(draggableId));

            const newSourceCustomers = _.cloneDeep(availableCustomers);
            newSourceCustomers.splice(source.index, 1);

            const newMapping = _.cloneDeep(customerZoneMappings);
            newMapping[destination.droppableId] = newDestinationCustomers;

            setCustomerZoneMappings(newMapping);
            setAvailableCustomers(newSourceCustomers);
            setRemovedCustomers(removedCustomers.filter(customer => customer._id !== draggableId));
        } else if(source.droppableId !== destination.droppableId && destination.droppableId === "Unmapped") {//mapped to unmapped
            const newRemovedCustomers = _.cloneDeep(removedCustomers);
            const removedCustomer = findCustomerByID(draggableId);
            const unmappedZones = [...removedCustomer.zones];
            unmappedZones[selectedDate.day()] = null;
            const unmappedDelivery = [...removedCustomer.delivery_order];
            unmappedDelivery[selectedDate.day()] = null;
            newRemovedCustomers.splice(destination.index, 0, {
                _id: removedCustomer._id,
                zones: unmappedZones,
                delivery_order: unmappedDelivery
            });

            const newSourceCustomers = _.cloneDeep(customerZoneMappings[source.droppableId]);
            newSourceCustomers.splice(source.index, 1);

            const newZonesMapping = _.cloneDeep(customerZoneMappings);
            newZonesMapping[source.droppableId] = newSourceCustomers;

            const newAvailableCustomers = _.cloneDeep(availableCustomers);
            newAvailableCustomers.splice(destination.index, 0, removedCustomer);


            setCustomerZoneMappings(newZonesMapping);
            setRemovedCustomers(newRemovedCustomers);
            setAvailableCustomers(newAvailableCustomers);
        } else if(source.droppableId === destination.droppableId && destination.droppableId === "Unmapped") {
            return;
        } else {
            alert("edge case?");
        }
    };

    const cardStyles = {
        width: "30%"
    };

    const cardContainerStyles = {
        width: "90%",
        minWidth: "90%",
        height: "100%",
        overflowY: "auto",
        fontSize: "smaller",
        textAlign: "center"
    };

    const gridItemStyle = {
        maxHeight: "75vh",
        minWidth: "10vw",
        borderRight: "1px solid"
    };

    const mappedCustomersFilterChange = (event, zoneID) => {
        const {value} = event.target;
        const newMapping = {...mappedCustomersFilterValue};
        newMapping[zoneID] = value
        setMappedCustomersFilterValue(newMapping);
    };

    const getCustomersForZoneAndDay = () => {
        const selectedDayOfWeek = selectedDate.day();
        const newMapping = {};
        const customersWithInvoicesForDate = invoices.map(invoice => invoice.customer);
        let availableMapping = [];
        zonesData.forEach(zone => {
            newMapping[zone._id] = allCustomersData
                .filter(customer => customer.zones[selectedDayOfWeek] === zone._id.toString() && customer.delivery_order[selectedDayOfWeek] !== null && customersWithInvoicesForDate.includes(customer._id))
                .sort((customerA, customerB) =>
                    customerA.delivery_order[selectedDayOfWeek] > customerB.delivery_order[selectedDayOfWeek] ? 1 :
                        customerA.delivery_order[selectedDayOfWeek] < customerB.delivery_order[selectedDayOfWeek] ? -1 : 0
                );
        });
        availableMapping = allCustomersData
            .filter(customer => (customer.delivery_order[selectedDayOfWeek] === null || customer.zones[selectedDayOfWeek] === null) && customersWithInvoicesForDate.includes(customer._id));
        setCustomerZoneMappings(newMapping);
        setAvailableCustomers(availableMapping);
    };

    const getUnmappedWeight = () => {
        let zoneWeight = 0;
        availableCustomers?.forEach(customer => {
            invoices.filter(invoice => invoice.customer === customer._id).forEach(invoice => zoneWeight += getTotalItemsWeightInGrams(invoice.items))
        });
        return zoneWeight;
    };

    return <div style={{height: "90%"}}>
        <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
        <div style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
        }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                    label="Date"
                    value={selectedDate}
                    onChange={onDateChange}
                    inputFormat="dd/MM/yyyy"
                    renderInput={(params) => <TextField {...params} />}
                />
            </LocalizationProvider>
            <Button variant="contained" onClick={saveChanges}style={{marginRight: "10em"}} disabled={!currentUserHasPermissions(requiredWritePermissions)}>Save Changes</Button>
            <Button variant="contained" onClick={fetchAllItems}>Reload</Button>
        </div>

        <div id={"test"}>
            <DragDropContext onDragEnd={handleOnDragEnd}>
                <Grid container spacing={{xs: 2}} columns={{xs: zonesData.length}} direction="row" style={{height: "fit-content"}} wrap={"nowrap"}>
                    <Grid item style={gridItemStyle}>
                        <p>Unmapped [{formatWeightToString(getUnmappedWeight())}]</p>
                        <Input placeholder={"Filter"} onChange={event => mappedCustomersFilterChange(event, "Unmapped")} value={mappedCustomersFilterValue["Unmapped"]} />
                        <Droppable droppableId={"Unmapped"}>
                            {(provided) => (
                                <div style={cardContainerStyles} {...provided.droppableProps} ref={provided.innerRef}>
                                    {availableCustomers.map(({_id, customer_name, order_taking_days}, index) => {
                                        return (
                                            <Draggable key={_id} draggableId={_id} index={index}>
                                                {(provided) => (
                                                    <Card
                                                        variant="outlined"
                                                        hidden={mappedCustomersFilterValue["Unmapped"]?.length ? !customer_name.toLowerCase().includes(mappedCustomersFilterValue["Unmapped"]?.toLowerCase()) : false}
                                                        style={cardStyles}
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                    >
                                                        <p>{customer_name}</p>
                                                    </Card>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </Grid>
                    {
                        zonesData.map(zone => {
                            let zoneWeight = 0;
                            customerZoneMappings[zone._id]?.forEach(customer => {
                                invoices.filter(invoice => invoice.customer === customer._id).forEach(invoice => zoneWeight += getTotalItemsWeightInGrams(invoice.items))
                            });
                            return <Grid item style={gridItemStyle}>
                                <p>{zone.name} [{formatWeightToString(zoneWeight)}]</p>
                                <Input placeholder={"Filter"} onChange={event => mappedCustomersFilterChange(event, zone._id)} value={mappedCustomersFilterValue[zone._id]} />
                                <Droppable droppableId={zone._id}>
                                    {(provided) => (
                                        <div style={cardContainerStyles} {...provided.droppableProps} ref={provided.innerRef}>
                                            {customerZoneMappings[zone._id]?.map(({_id, customer_name, order_taking_days}, index) => {
                                                return (
                                                    <Draggable key={_id} draggableId={_id} index={index}>
                                                        {(provided) => (
                                                            <Card
                                                                variant="outlined"
                                                                hidden={mappedCustomersFilterValue[zone._id]?.length ? !customer_name.toLowerCase().includes(mappedCustomersFilterValue[zone._id]?.toLowerCase()) : false}
                                                                style={cardStyles}
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                            >
                                                                <p>{customer_name}</p>
                                                            </Card>
                                                        )}
                                                    </Draggable>
                                                );
                                            })}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </Grid>;
                        })
                    }
                </Grid>
            </DragDropContext>
        </div>
    </div>
};