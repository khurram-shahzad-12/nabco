import React from 'react';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

export const listChipsCellRenderer = (props) => {
    if(!props.mappingDataLoaded) {
        return "Loading...";
    }

    return <Stack direction="row" spacing={1}>
        {props.value?.map(item =>
            <Chip label={
                props?.idMapping[item] ?
                    props.idMapping[item][props.nameField]
                    :
                    "`Mapping missing for ID:${props.value}`"}
                  key={item}
            />)
        }
    </Stack>;
};