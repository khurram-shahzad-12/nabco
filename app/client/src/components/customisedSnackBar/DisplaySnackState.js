const displaySnackState = (message, severity, setStateFN) => {
    setStateFN({
        open: true,
        message: message,
        severity: severity
    });
};

export default displaySnackState;