const QUOTATION_SERVICE = require('./service');

const getAllQuotations = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;
        res.status(200).json(await QUOTATION_SERVICE.getAllQuotations(start_date, end_date));
    } catch (e) { next(e); }
};
const createNewQuotation = async (req, res, next) => {
    try {
        const data = req.body
        res.status(201).json(await QUOTATION_SERVICE.createNewQuotation(data));
    } catch (e) { next(e); }
}
const deleteQuotation = async (req, res, next) => {
    try {
        const { id } = req.params;
        res.status(200).json(await QUOTATION_SERVICE.deleteQuotation(id));
    } catch (e) { next(e); }
}
const updateQuotation = async (req, res, next) => {
    try {
        const quotation = req.body
        const { id } = req.params;
        res.status(200).json(await QUOTATION_SERVICE.updateQuotation(id, quotation));
    } catch (e) { next(e); }
}
module.exports = {
   createNewQuotation,
   getAllQuotations,
   deleteQuotation,
   updateQuotation,
};
