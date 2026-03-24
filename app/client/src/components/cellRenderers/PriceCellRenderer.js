export const PriceCellRenderer = props => {
    const field = props.colDef.field;
    return props.data[field].toFixed(2);
};