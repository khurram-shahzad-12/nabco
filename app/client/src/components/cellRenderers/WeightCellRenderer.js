import {formatWeightToString, getTotalItemsWeightInGrams} from "../formFunctions/FormFunctions";

export const WeightCellRenderer = props => {
    const totalWeightInGrams = getTotalItemsWeightInGrams(props.data.items);

    return formatWeightToString(totalWeightInGrams);
};