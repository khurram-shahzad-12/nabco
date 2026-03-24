import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react';
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

export const tagsFilter =  forwardRef((props, ref) => {
    const initialSelectedTags = props.tagsList.menuEntries.reduce((prev_val, current_val) => {
        prev_val[current_val] = false;
        return prev_val;
    }, {});
    const [allTagsVisible, setAllTagsVisible] = useState(true);

    const [selectedTags, setSelectedTags] = useState(initialSelectedTags);

    // expose AG Grid Filter Lifecycle callbacks
    useImperativeHandle(ref, () => {
        return {
            doesFilterPass(params) {
                const filterDataSource = params.data[props.columnName];
                let found = false;
                let count = 0;
                while(!found && count < filterDataSource.length) {
                    found = selectedTags[filterDataSource[count]];
                    count++
                }
                return found;
            },

            isFilterActive() {
                return !allTagsVisible;
            },

            // this example isn't using getModel() and setModel(),
            // so safe to just leave these empty. don't do this in your code!!!
            getModel() {
            },

            setModel() {
            },
        };
    });

    const allTagsSelectionChange = event => {
        const { checked } = event.target;
        if(checked)
            setSelectedTags(initialSelectedTags);
        setAllTagsVisible(checked);
    };

    const tagsFilterChange = (event, newValue, tagID) => {
        let newSelectedTags = {...selectedTags};
        newSelectedTags[tagID] = newValue;
        setSelectedTags(newSelectedTags);
        if(allTagsVisible)
            setAllTagsVisible(false);
    };
    useEffect(() => {
        props.filterChangedCallback();
    }, [allTagsVisible, selectedTags]);

    return (
        <div
            style={{display: 'inline-block', width: '200px'}}
        ><FormControl sx={{m: 3}} component="fieldset" variant="standard">
            <FormLabel component="legend">Visible Tags</FormLabel>
            <FormGroup>
                <FormControlLabel
                    control={
                        <Checkbox name="Show All" checked={allTagsVisible} onChange={allTagsSelectionChange}/>
                    }
                    label="Show All"
                />
                {
                    props.tagsList.menuEntries.map((entry, index) =>
                        <FormControlLabel
                            control={
                                <Checkbox name={props.tagsList.map[entry].name} index={entry} checked={selectedTags[entry]} onChange={(event, newValue) => tagsFilterChange(event, newValue, entry)}/>
                            }
                            label={props.tagsList.map[entry].name}
                        />
                    )
                }
            </FormGroup>
        </FormControl>
        </div>
    );
});