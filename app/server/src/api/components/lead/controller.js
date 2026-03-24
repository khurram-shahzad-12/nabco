const LEAD_CUSTOMER = require('./service');
const getAllLeads = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;
        res.status(200).json(await LEAD_CUSTOMER.getAllLeads(start_date, end_date));
    } catch (e) { next(e); }
};
const getOnlyLeads = async (req, res, next) => {
    try {
        res.status(200).json(await LEAD_CUSTOMER.getOnlyLeads());
    } catch (e) { next(e); }
};
const getSingleLead = async (req, res, next) => {
    try {
        const { id } = req.params
        res.status(200).json(await LEAD_CUSTOMER.getSingleLead(id));
    } catch (e) { next(e); }
}
const createNewLead = async (req, res, next) => {
    try {
        const lead = req.body
        res.status(201).json(await LEAD_CUSTOMER.createNewLead(lead));
    } catch (e) { next(e); }
}
const updatedLead = async (req, res, next) => {
    try {
        const lead = req.body
        const { id } = req.params;
        res.status(200).json(await LEAD_CUSTOMER.updateLead(id, lead));
    } catch (e) { next(e); }
}

const deleteLead = async (req, res, next) => {
    try {
        const { id } = req.params;
        res.status(200).json(await LEAD_CUSTOMER.deleteLead(id));
    } catch (e) { next(e); }
}
const getAllLeadOfSingleRep = async (req, res, next) => {
    try {
        const { start_date, end_date, repId, page, limit } = req.query;
        res.status(200).json(await LEAD_CUSTOMER.getAllLeadOfSingleRep(start_date, end_date, repId, page, limit));
    } catch (e) { next(e); }
}
module.exports = {
    getAllLeads,
    getSingleLead,
    createNewLead,
    updatedLead,
    deleteLead,
    getAllLeadOfSingleRep,
    getOnlyLeads,
};
