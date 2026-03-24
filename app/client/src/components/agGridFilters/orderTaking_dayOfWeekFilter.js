import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import {daysMap} from '../formFunctions/FormFunctions';

export const OrderTaking_dayOfWeekFilter = forwardRef((props, ref) => {
    const initialSelectedDays = [];
    const [selectedDays, setSelectedDays] = useState(initialSelectedDays);
    const [allDaysVisible, setAllDaysVisible] = useState(true);

    // expose AG Grid Filter Lifecycle callbacks
    useImperativeHandle(ref, () => {
        return {
            doesFilterPass(params) {
                const filterDataSource = params.data[props.columnName];
                return selectedDays.some(item => filterDataSource.includes(item));
            },

            isFilterActive() {
                return !allDaysVisible;
            },

            // this example isn't using getModel() and setModel(),
            // so safe to just leave these empty. don't do this in your code!!!
            getModel() {
            },

            setModel() {
            },
        };
    });

    const daySelectionChange = (event, index) => {
        const {checked} = event.target;
        let newSelectedDays = [...selectedDays];
        if(checked) {
            newSelectedDays.push(index)
        } else {
            newSelectedDays = newSelectedDays.filter(item => item !== index);
        }
        setSelectedDays(newSelectedDays);
        if(allDaysVisible)
            setAllDaysVisible(false);
    };

    const allDaysSelectionChange = event => {
        const { checked } = event.target;
        if(checked) {
            setSelectedDays(initialSelectedDays);
        }
        setAllDaysVisible(checked);
    }

    useEffect(() => {
        props.filterChangedCallback();
    }, [allDaysVisible, selectedDays]);

    return (
        <div
            style={{display: 'inline-block', width: '200px'}}
        ><FormControl sx={{m: 3}} component="fieldset" variant="standard">
            <FormLabel component="legend">Visible Days</FormLabel>
            <FormGroup>
                <FormControlLabel
                    control={
                        <Checkbox name="All days" checked={allDaysVisible} onChange={allDaysSelectionChange}/>
                    }
                    label="All days"
                    />
                {
                    daysMap.map((day, index) =>
                        <FormControlLabel
                            control={
                                <Checkbox name={day} index={index} checked={selectedDays.includes(index)} onChange={event => daySelectionChange(event, index)}/>
                            }
                            label={day}
                        />
                    )
                }
            </FormGroup>
        </FormControl>
        </div>
    );
});