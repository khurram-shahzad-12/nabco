export const InvoiceSectionZoneRenderer = props => {
    let sectionNameForDay;
    let zoneName;

    if(!props.customers.loaded || !props.zones.loaded) {
        return "Loading...";
    }

    try {
        const currentCustomer = props.customers.map[props.data.customer];
        const invoice_dayOfWeek = new Date(props.data.invoice_date).getDay();
        const sectionIdForDay = currentCustomer.delivery_days[invoice_dayOfWeek];
        const sectionForDay = props.sections.map[sectionIdForDay]
        sectionNameForDay = sectionForDay.name;
        zoneName = props.zones.map[sectionForDay.zone].name;
    } catch (err) {
        return "Section/Zone mapping missing";
    }

    return `${sectionNameForDay}(${zoneName})`;
};