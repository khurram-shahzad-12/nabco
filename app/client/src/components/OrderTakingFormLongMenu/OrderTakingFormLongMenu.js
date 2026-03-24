import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import HistoryIcon from '@mui/icons-material/History';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import PersonRemoveAlt1Icon from '@mui/icons-material/PersonRemoveAlt1';
import ImageIcon from '@mui/icons-material/Image';
import displaySnackState from "../customisedSnackBar/DisplaySnackState";
import {createCustomerItemsList, editCustomerItemsList} from "../formFunctions/FormFunctions";

const ITEM_HEIGHT = 48;

const LongMenu = props => {
    const {currentCustomer, customerItems, currentItem, updateCustomerItems, setSnackState, setSendingData} = props;
    const disableRemove = currentItem._id && customerItems ? customerItems.items.findIndex(item => item._id === currentItem._id) === -1 : true;
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleClick = event => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleShowHistory = () => {
        handleClose();
        props.showItemHistory(currentItem);
    };

    const handleAddItem = () => {
        if(currentItem.rate < currentItem.min_sale_price) {
            displaySnackState("Correct item rate first", "error", setSnackState);
            return;
        }

        if(customerItems) {
            let updatedCustomerItemId = "";
            const existingEntryIndex = customerItems.items.findIndex(item => item._id === currentItem._id);
            if(existingEntryIndex > -1) {
                customerItems.items[existingEntryIndex].rate = currentItem.rate;
                updatedCustomerItemId =customerItems.items[existingEntryIndex]._id;
            } else {
                updatedCustomerItemId = currentItem._id;
                customerItems.items.push(
                    {
                        _id: currentItem._id,
                        rate: currentItem.rate
                    }
                    );
            }
            customerItems.updateCustomerItemId = updatedCustomerItemId;
            editCustomerItemsList("/customerItems", customerItems, setSendingData, setSnackState, updateCustomerItems);
        } else {
            const data = {
                customer: currentCustomer,
                items: [{
                    _id: currentItem._id,
                    rate: currentItem.rate
                }]
            };
            createCustomerItemsList("/customerItems", data, setSendingData, setSnackState, updateCustomerItems);
        }
        handleClose();
    };

    const handleRemoveItem = () => {
        const indexToRemove = customerItems.items.findIndex(item => item._id === currentItem._id);
        customerItems.items.splice(indexToRemove, 1);
        editCustomerItemsList("/customerItems", customerItems, setSendingData, setSnackState, updateCustomerItems);

        handleClose();
    };

    const handleShowImage = () => {
        props.showImage(currentItem);
    };

    return (
        <div>
            {!props.selectedLead && (<IconButton
                aria-label="more"
                id="long-button"
                aria-controls={open ? 'long-menu' : undefined}
                aria-expanded={open ? 'true' : undefined}
                aria-haspopup="true"
                onClick={handleClick}
            >
                <MoreVertIcon />
            </IconButton>)}
            <Menu
                id="long-menu"
                MenuListProps={{
                    'aria-labelledby': 'long-button',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    style: {
                        maxHeight: ITEM_HEIGHT * 4.5,
                        width: '20ch',
                    },
                }}
            >
                {!props.quotation && (<MenuItem key={0} onClick={handleShowHistory} disabled={currentItem._id === null}>
                    <HistoryIcon />
                    Item History
                </MenuItem>)}
                <MenuItem key={1} onClick={handleAddItem} disabled={currentItem._id === null}>
                    <PersonAddAlt1Icon />
                    Add Default Item
                </MenuItem>
                <MenuItem key={2} onClick={handleRemoveItem} disabled={disableRemove}>
                    <PersonRemoveAlt1Icon />
                    Remove Default Item
                </MenuItem>
                <MenuItem key={3} onClick={handleShowImage}>
                    <ImageIcon />
                    Show Image
                </MenuItem>
            </Menu>
        </div>
    );
};

export default LongMenu;
