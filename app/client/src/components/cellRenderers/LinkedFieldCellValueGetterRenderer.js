const LinkedFieldCellValueGetterRenderer = (props) => {
	if(!props.mappingDataLoaded) {
		return "Loading...";
	}

	const field = props.colDef.field;
	const cellIDValue = props.data[field];
	if(props.idMapping[cellIDValue]) {
		return props.idMapping[cellIDValue][props.mappedFieldName];
	} else {
		return `Mapping missing for ID:${cellIDValue}`;
	}
};

export default LinkedFieldCellValueGetterRenderer;