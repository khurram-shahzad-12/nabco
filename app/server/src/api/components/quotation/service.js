const QuotationModel = require('./model');
const {getDateRangeFilter} = require('../../../utils/crmUtility');
const mongoose = require('mongoose');

const createNewQuotation = async (data) => {return await QuotationModel.create(data);}
const getAllQuotations = async (start_date, end_date) => {
    const filter = getDateRangeFilter(start_date, end_date);
    return await QuotationModel.find(filter).sort({createdAt: -1});
}
const deleteQuotation = async (id) => {
    const Quotation = await QuotationModel.findById(id);
    if(!Quotation) throw new Error("Quotation not found");
    return await QuotationModel.findByIdAndDelete(id);
}
const updateQuotation = async (id, quotation) => {
    const updateQuotation = await QuotationModel.findByIdAndUpdate(id, quotation, { new: true, runValidators: true });
    if (!updateQuotation) throw new Error('Quotation does not exit');
    return updateQuotation;
}
const getQuotationsByIds = async (ids) => {
    const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));
    return await QuotationModel.find({_id: {$in: objectIds}}).sort({createdAt: -1});
}
module.exports = {
    createNewQuotation,
    getAllQuotations,
    deleteQuotation,
    updateQuotation,
    getQuotationsByIds,
};
