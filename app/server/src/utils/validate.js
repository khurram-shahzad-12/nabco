const mongoose = require('mongoose');
const createError = require('http-errors');

const errMsg = (fieldName, value) => `Invalid [${fieldName}]: "${value}"`;

const validate = {
    id: (id, fieldName = '_id') => {
        if (Array.isArray(id)) {
            id.forEach(value => {
                if (!mongoose.isValidObjectId(value)) throw new createError.BadRequest(errMsg(fieldName, value));
            });
        } else {
            if (!mongoose.isValidObjectId(id)) throw new createError.BadRequest(errMsg(fieldName, id));
        }
        return id;
    },
};

module.exports = validate;
