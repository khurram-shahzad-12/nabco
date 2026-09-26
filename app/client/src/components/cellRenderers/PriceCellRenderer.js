export const PriceCellRenderer = props => {
    const field = props.colDef.field;
    const value = props.data?.[field];

    if (value === null || value === undefined || value === "") return "";
    const num = Number(value);
    if (Number.isNaN(num)) return "";

    return num.toFixed(2);
};