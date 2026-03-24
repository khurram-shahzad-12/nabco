const extractProperties = (payload, allowedModifiableProperties) => {
    const newPayload = {};
    for (const property of allowedModifiableProperties) {
        if (payload.hasOwnProperty(property)) {
            newPayload[property] = payload[property];
        }
    }
    return newPayload;
};

module.exports = extractProperties;
