const OPPORTUNITY_SERVICE = require('./service');
const updateOpportunity = async (req, res, next) => {
    try {
        const { _id, ...rest } = req.body;
        const data = { ...rest, lead: _id }
        res.status(200).json(await OPPORTUNITY_SERVICE.updateOpportunity(data));
    } catch (e) { next(e); }
}
const crmDashboard = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;
        res.status(200).json(await OPPORTUNITY_SERVICE.crmDashboard(start_date, end_date));
    } catch (e) { next(e); }
}
const teleSalesDashboard = async (req, res, next) => {
    try {
        const { start_date, end_date, repId } = req.query;
        res.status(200).json(await OPPORTUNITY_SERVICE.teleSalesDashboard(start_date, end_date, repId));
    } catch (e) { next(e); }
}
module.exports = {
    updateOpportunity,
    crmDashboard,
    teleSalesDashboard,
}