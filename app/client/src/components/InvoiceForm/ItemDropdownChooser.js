import React, { useState } from "react";
import { Input, TextField } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { defaultSnackState } from "../formFunctions/FormFunctions";
import displaySnackState from "../customisedSnackBar/DisplaySnackState";
import CustomisedSnackBar from "../customisedSnackBar/CustomisedSnackBar";
import { OrderTakingFormItemChooserActionCellRenderer } from "../cellRenderers/OrderTakingFormRemoveItemCellRenderer";
import { v4 as uuidv4 } from 'uuid';
import styles from "./ItemChooserStyles.module.css";
import ImageViewDialog from "../ImageViewDialog/ImageViewDialog";
import { useAuth } from "../../contexts/AuthContext";

export const ItemDropdownChooser = props => {
    const { hasPermission } = useAuth();
    const { currentCustomer, customerItems, updateCustomerItems, setSendingData, canEdit, itemsAudit, setItemsAudit } = props;
    const requiredPriceOverridePermission = process.env.REACT_APP_WRITE_OVERRIDE_MIN_SALE_PRICE_CLAIM;
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [itemNameFilter, setItemNameFilter] = useState("");
    const [quantityFilter, setQuantityFilter] = useState(null);
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [imageDialogID, setImageDialogID] = useState(null);
    const itemsList = [...props.itemsList];
    const barcodeItemsMap = {};
    Object.keys(props.productsList.map).forEach(key => {
        let currentItem = props.productsList.map[key];
        if (currentItem.active)
            barcodeItemsMap[currentItem.barcode] = currentItem
    });
    const newAutoCompleteOptions = Object.keys(props.productsList.map)
        .map(key => props.productsList.map[key])
        .filter(item => item.active && item.name);

    const setNewItemsList = newItemsList => {
        props.setItems(newItemsList);
    };
    const getItemRate = item => {
        if (customerItems) {
            const itemIndex = customerItems.items.findIndex(currentCustomerItem => currentCustomerItem._id === item._id);
            if (itemIndex > -1) {
                return customerItems.items[itemIndex].rate;
            }
        }
        return props.collection_invoice ? item.collection_price : item.default_sale_price;
    };

    const buildNewItemsList = (item, index) => {
        item.rate = getItemRate(item);
        item.quantity = itemsList[index].quantity;
        item.tax = props.vatData.map[item.vat].rate;
        item.key = uuidv4();
        item.list_price = item.list_price ?? null;
        item.discount_percent = item.discount_percent ?? null;
        let newItemsList = [...itemsList];
        newItemsList[index] = item;
        return newItemsList;
    };

    const itemChangeListener = (dropdownItem, index) => {
        if (dropdownItem) {
            if (itemsList.map(item => item._id).includes(dropdownItem._id)) {
                alert(`${dropdownItem.name} already exists in order list`);
                return;
            }
            let auditClone = { ...itemsAudit };
            const oldName = itemsList[index]?.name;
            if (oldName) delete auditClone[oldName];
            if(dropdownItem.name) auditClone[dropdownItem.name] = itemsList[index].quantity;
            setItemsAudit(auditClone);
            setNewItemsList(buildNewItemsList({ ...dropdownItem }, index));
        } else {
            let newItemsList = [...itemsList];
            const removedItem = newItemsList.splice(index, 1);
            setNewItemsList(newItemsList);
            let auditClone = { ...itemsAudit };
            const removedName = removedItem[0]?.name;
            if (removedName) delete auditClone[removedItem[0].name];
            setItemsAudit(auditClone);
        }
    };

    const handleBarcodeChange = (newBarcode, index) => {
        itemChangeListener(barcodeItemsMap[newBarcode], index);
    };

    const getBarcodeCellRenderer = (item, index) => {
        if (itemsList[index]._id === null || props.productsList.map[itemsList[index]._id]) {
            return <Autocomplete
                value={item._id ? item.barcode ? item.barcode : props.productsList.map[item._id].barcode : null}
                options={Object.keys(barcodeItemsMap)}
                onChange={(event, item) => handleBarcodeChange(item, index)}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        variant="standard"
                    />
                )}
                renderOption={(props, option) => (
                    <li {...props} key={option}>
                        {option}
                    </li>
                )}
                disabled={!canEdit}
                disableClearable
            />;
        } else {
            return <TextField
                fullWidth
                disabled
                value={itemsList[index].barcode}
            />;
        }
    };

    const ItemSelectRenderer = index => {
        if (itemsList[index]._id === null || props.productsList.map[itemsList[index]._id]) {
            return <Autocomplete
                name="items"
                options={newAutoCompleteOptions}
                onChange={(event, item) => itemChangeListener(item, index)}
                autoComplete={false}
                fullWidth
                value={itemsList[index]._id ? props.productsList.map[itemsList[index]._id] : null}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        variant="standard"
                    />
                )}
                getOptionLabel={option => option?.name ?? ''}
                renderOption={(props, option) => (
                    <li {...props} key={option._id}>
                        {option.name}
                    </li>
                )}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                disabled={!canEdit}
            />
        } else {
            return <TextField
                fullWidth
                disabled
                value={itemsList[index].name}
            />;
        }
    };

    const getVatAmount = item => {
        if (item._id) {
            const vatRate = props.vatData.map[item.vat].rate;
            const amount = (item.quantity * item.rate * (vatRate / 100)).toFixed(2);
            return Number(amount);
        } else {
            return 0.00;
        }
    };

    const getValue = item => {
        if (item) {
            const value = item.quantity * item.rate + getVatAmount(item);
            return Number(value.toFixed(2));
        } else {
            return 0.00
        }
    };

    const vatCodeCellRenderer = vatID => {
        if (vatID) {
            return props.vatData.map[vatID].name;
        } else {
            return "";
        }
    };

    const vatRateCellRenderer = vatID => {
        if (vatID) {
            return props.vatData.map[vatID].rate.toFixed(2);
        } else {
            return "";
        }
    };

    const vatAmountCellRenderer = item => {
        if (item) {
            return getVatAmount(item).toFixed(2);
        } else {
            return 0.00;
        }
    };

    const valueAmountCellRenderer = item => {
        if (item) {
            return getValue(item).toFixed(2);
        } else {
            return 0.00;
        }
    };

    const handleQuantityChange = (event, index) => {
        const updatedValue = Number(event.target.value);
        if (updatedValue > 0) {
            let newItemsList = [...itemsList];
            newItemsList[index].quantity = updatedValue;
            setNewItemsList(newItemsList);
            let auditClone = { ...itemsAudit };
            const name = itemsList[index]?.name;
            if(name) auditClone[name] = updatedValue;
            setItemsAudit(auditClone);
            setSnackState(defaultSnackState);
        } else {
            displaySnackState("Minimum Quantity: 1", "warning", setSnackState);
        }
    };

    const getQuantityCellRenderer = (item, index) => {
        return <TextField
            defaultValue={item.quantity}
            variant={"standard"}
            onChange={event => handleQuantityChange(event, index)}
            disabled={item._id === null || !canEdit}
            inputProps={{ style: { textAlign: 'right' } }}
            InputProps={{ disableUnderline: true }}
            key={item.key}
        />;
    };

    const handleRateChange = (event, item, index) => {
        const newValue = Number(event.target.value);
        const inv = props.productsList.map[item._id];
        const min_price = props.productsList.map[item._id].min_sale_price;
        if (newValue >= min_price || hasPermission(requiredPriceOverridePermission)) {
            let newItemsList = [...itemsList];
            newItemsList[index].rate = newValue;
            const discountPercent = item.discount_percent != null ? +item.discount_percent : inv?.discount_percent;
            if (discountPercent != null && discountPercent < 100) {
                newItemsList[index].list_price = +(newValue / (1 - discountPercent / 100)).toFixed(2);
            }
            setNewItemsList(newItemsList);
            setSnackState(defaultSnackState);
        } else {
            displaySnackState(`Minimum Rate: £${min_price.toFixed(2)}`, "warning", setSnackState);
        }
    };

    const handleDiscountChange = (event, item, index) => {
        const newDiscount = Number(event.target.value);
        if (isNaN(newDiscount) || newDiscount < 0 || newDiscount > 100) {
            displaySnackState("Discount must be between 0 and 100", "warning", setSnackState);
            return;
        }
        const inv = props.productsList.map[item._id] || {};
        const effectiveListPrice = item.list_price != null ? +item.list_price : (inv.list_price != null ? +inv.list_price : null);
        if (effectiveListPrice == null) {
            displaySnackState("List price not available for this item", "warning", setSnackState);
            return;
        }
        const newNett = +(effectiveListPrice * (1 - newDiscount / 100)).toFixed(2);
        const min_price = inv.min_sale_price;
        if (newNett < min_price && !hasPermission(requiredPriceOverridePermission)) {
            displaySnackState(`Minimum Rate: £${min_price.toFixed(2)}`, "warning", setSnackState);
            return;
        }

        let newItemsList = [...itemsList];
        newItemsList[index].discount_percent = newDiscount;
        newItemsList[index].list_price = effectiveListPrice;
        newItemsList[index].rate = newNett;
        setNewItemsList(newItemsList);
        setSnackState(defaultSnackState);
    };

    const getRateCellRenderer = (item, index) => {
        return <TextField
            value={item.rate ?? ''}
            variant={"standard"}
            onChange={event => handleRateChange(event, item, index)}
            disabled={item._id === null || !canEdit}
            inputProps={{ style: { textAlign: 'right' } }}
            InputProps={{ disableUnderline: true }}
            key={item.key}
        />;
    };

    const getDiscountCellRenderer = (item, index) => {
        const inv = props.productsList.map[item._id] || {};
        const initialDiscount = item.discount_percent != null ? item.discount_percent : (inv.discount_percent != null ? inv.discount_percent : '');
        return <TextField
            value={initialDiscount}
            variant={"standard"}
            onChange={event => handleDiscountChange(event, item, index)}
            disabled={item._id === null || !canEdit}
            inputProps={{ style: { textAlign: 'right' }, min: 0, max: 100, step: 1 }}
            InputProps={{ disableUnderline: true }}
            key={item.key + '-disc'}
        />;
    };
    const rowItemDeleteAction = index => {
        let newItemsList = [...itemsList];
        const removedItem = newItemsList.splice(index, 1);
        setNewItemsList(newItemsList);
        let auditClone = { ...itemsAudit };
        const removedName =removedItem[0]?.name;
        if (removedName) delete auditClone[removedName];
        setItemsAudit(auditClone);
    };

    const handleCloseImageDialog = () => {
        setImageDialogOpen(false);
    };

    const showImage = item => {
        setImageDialogID(item._id);
        setImageDialogOpen(true);
    };

    const getActionCellRenderer = index => {
        return OrderTakingFormItemChooserActionCellRenderer(
            {
                rowIndex: index,
                deleteRow: rowItemDeleteAction,
                currentCustomer: currentCustomer,
                customerItems: customerItems,
                currentItem: itemsList[index],
                updateCustomerItems: updateCustomerItems,
                setSnackState: setSnackState,
                setSendingData: setSendingData,
                showItemHistory: props.showItemHistory,
                canEdit: canEdit,
                showImage: showImage,
                quotation: props.quotation,
                selectedLead: props.selectedLead,
            }
        );
    };

    const shouldFilterRow = item => {
        if (itemNameFilter) {
            return !item.name?.toLowerCase().includes(itemNameFilter.toLowerCase());
        }
        return false;
    };

    const shouldFilterQuantityRow = index => {
        if (quantityFilter) {
            return !(itemsList[index].quantity.toString().includes(quantityFilter));
        }
        return false;
    };

    const listPriceCellRenderer = item => {
        if (item?.list_price != null) { return (+item.list_price).toFixed(2); }
        if (item?._id) {
            const inv = props.productsList.map[item._id];
            return inv?.list_price != null ? (+inv.list_price).toFixed(2) : '';
        }
        return '';
    };

    const discountPercentCellRenderer = item => {
        if (item?.discount_percent != null) return (+item.discount_percent).toFixed(2) + '%';
        if (item?._id) {
            const inv = props.productsList.map[item._id];
            return inv?.discount_percent != null ? (+inv.discount_percent).toFixed(2) + '%' : '';
        }
        return '';
    };

    return <>
        <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
        <ImageViewDialog _id={imageDialogID} open={imageDialogOpen} handleClose={handleCloseImageDialog} />
        <div style={{ height: "5%", marginBottom: "5px" }}>
            <table>
                <thead className={styles.Header}>
                    <tr>
                        <th className={styles.Barcode}>Barcode</th>
                        <th className={styles.Name}>Name</th>
                        <th className={styles.Quantity}>Qty</th>
                        {/* <th className={styles.VATCode}>VAT Code</th> */}
                        <th className={styles.VATRate}>VAT(%)</th>
                        <th className={styles.VATAmount}>VAT (£)</th>
                        <th className={styles.ListPrice}>List Price(£)</th>
                        <th className={styles.Discount}>Disc %</th>
                        <th className={styles.Rate}>Nett(£)</th>
                        <th className={styles.Value}>Value(£)</th>
                        <th className={styles.Action}>Action</th>
                    </tr>
                </thead>
            </table>
        </div>
        <div style={{ height: "90%", overflow: "auto", borderBottom: "solid 1px" }}>
            <table>
                <tbody className={styles.ItemChooserColumn}>
                    <tr>
                        <td className={styles.Barcode}></td>
                        <td className={styles.Name}><Input fullWidth placeholder={"(Filter)"} inputProps={{ style: { textAlign: 'center' } }} onChange={e => setItemNameFilter(e.target.value)} /></td>
                        {/*<td className={styles.Quantity}><Input fullWidth placeholder={"(Filter)"} inputProps={{style: { textAlign: 'center' }}} onChange={e => setQuantityFilter(e.target.value)} /></td>*/}
                        <td className={styles.Quantity}></td>
                        {/* <td className={[styles.VATCode, styles.cellCenterAlign].join(" ")}></td> */}
                        <td className={[styles.VATRate, styles.cellRightAlign].join(" ")}></td>
                        <td className={[styles.VATAmount, styles.cellRightAlign].join(" ")}></td>
                        <td className={styles.ListPrice}></td>
                        <td className={styles.Discount}></td>
                        <td className={styles.Rate}></td>
                        <td className={[styles.Value, styles.cellRightAlign].join(" ")}></td>
                        <td className={styles.Action}></td>
                    </tr>
                    {
                        itemsList.map((item, index) => {
                            return <tr key = {item.key || index} hidden={shouldFilterRow(item) || shouldFilterQuantityRow(index)}>
                                <td className={styles.Barcode}>{getBarcodeCellRenderer(item, index)}</td>
                                <td className={styles.Name}>{ItemSelectRenderer(index)}</td>
                                <td className={styles.Quantity}>{getQuantityCellRenderer(item, index)}</td>
                                {/* <td className={[styles.VATCode, styles.cellCenterAlign].join(" ")}>{vatCodeCellRenderer(item.vat)}</td> */}
                                <td className={[styles.VATRate, styles.cellRightAlign].join(" ")}>{vatRateCellRenderer(item.vat)}</td>
                                <td className={[styles.VATAmount, styles.cellRightAlign].join(" ")}>{vatAmountCellRenderer(item)}</td>
                                <td className={[styles.ListPrice, styles.cellRightAlign].join(" ")}>{listPriceCellRenderer(item)}</td>
                                <td className={[styles.Discount, styles.cellRightAlign].join(" ")}>{getDiscountCellRenderer(item, index)}</td>
                                <td className={styles.Rate}>{getRateCellRenderer(item, index)}</td>
                                <td className={[styles.Value, styles.cellRightAlign].join(" ")}>{valueAmountCellRenderer(item)}</td>
                                <td className={styles.Action}>{getActionCellRenderer(index)}</td>
                            </tr>
                        })
                    }
                </tbody>
            </table>
        </div>
    </>
};