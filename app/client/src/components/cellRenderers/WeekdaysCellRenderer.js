import React from 'react';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import {daysMap} from '../formFunctions/FormFunctions';

export const weekdaysCellRenderer = (props) => {

	return <Stack direction="row" spacing={1}>
		{props.value.map((item, index) => item? <Chip label={daysMap[index].toUpperCase().substring(0, 3)} key={index}/> : "")}
	</Stack>;
};