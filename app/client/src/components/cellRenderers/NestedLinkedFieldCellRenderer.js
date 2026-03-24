import React from 'react';

const NestedLinkedFieldCellRenderer = (props) => {

	const returnFail = () => {
		return `Mapping missing for ID:${props.value}`;
	};

	if(props.parentMapping[props.value]) {
		const parentItem = props.parentMapping[props.value];
		const targetParentFieldValue = parentItem[props.parentFieldName];
		if(props.childMapping[targetParentFieldValue]) {
			return props.childMapping[targetParentFieldValue][props.childFieldName];
		} else {
			return returnFail();
		}
	} else {
		return returnFail();
	}
};

export default NestedLinkedFieldCellRenderer;