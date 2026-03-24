import React from 'react';
import { Button } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';

export const LoadingButton = props => {

	return <Button variant="contained" type="submit" startIcon={props.loading ? <CircularProgress size="1em" /> : props.icon} disabled={props.disabled} >
		{props.buttonLabel}
	</Button>;
}