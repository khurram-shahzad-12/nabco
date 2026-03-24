import moment from "moment";

export const DateCellRenderer = props => {
    const field = props.colDef.field;
    return moment.utc(props.data[field]).format("DD-MM-YYYY HH:mm:ss");
};