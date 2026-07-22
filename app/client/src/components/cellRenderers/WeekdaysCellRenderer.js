import React from 'react';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import {daysMap} from '../formFunctions/FormFunctions';

export const weekdaysCellRenderer = (props) => {
	const weekdays = Array.isArray(props.value) ? props.value : [];
	return <Stack direction="row" spacing={1}>
		{weekdays.map((item, index) => item? <Chip label={daysMap[index].toUpperCase().substring(0, 3)} key={index}/> : "")}
	</Stack>;
};