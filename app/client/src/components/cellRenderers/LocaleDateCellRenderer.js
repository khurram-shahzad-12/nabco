const LocaleDateCellRenderer = props => {
    return new Date(props.value).toLocaleDateString();
};

export default LocaleDateCellRenderer;