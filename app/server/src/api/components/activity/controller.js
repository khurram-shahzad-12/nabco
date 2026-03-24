const ACTIVITY_SERVICE = require('./service');

const createActivity = async (req, res, next) => {
    try {
        const activityData = req.body;
        res.status(201).json(await ACTIVITY_SERVICE.createActivity(activityData));
    } catch (e) {next(e)}
}

module.exports = {
    createActivity,
}