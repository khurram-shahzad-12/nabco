export const InvoiceZoneOrderRenderer = props => {
    let zoneOrder;
    let zoneName;

    if(!props.customers.loaded || !props.zones.loaded) {
        return "Loading...";
    }

    try {
        const currentCustomer = props.customers.map[props.data.customer];
        const invoice_dayOfWeek = new Date(props.data.invoice_date).getDay();
        const zoneID = currentCustomer.zones[invoice_dayOfWeek].toString();
        zoneOrder = currentCustomer.delivery_order[invoice_dayOfWeek];
        zoneName = props.zones.map[zoneID].name;
        if(!zoneName || !zoneOrder)
            throw new Error("Zone or Order not assigned");
    } catch (err) {
        return "Zone mapping missing";
    }

    return `${zoneName}(${zoneOrder})`;
};