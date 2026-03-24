const activityModel = require("./model");

const createActivity = async (data) => {
    return await activityModel.create(data);
}

module.exports = {
    createActivity,
}