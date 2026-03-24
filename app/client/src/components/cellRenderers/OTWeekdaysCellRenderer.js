import React from 'react';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import {daysMap} from '../formFunctions/FormFunctions';

export const OTWeekdaysCellRenderer = (props) => {

	return <Stack direction="row" spacing={1}>
		{props.value.map((item) => <Chip label={daysMap[item].toUpperCase().substring(0, 3)} key={item}/>)}
	</Stack>;
};