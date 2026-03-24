const CounterModel = require('./model');

const getNextQuotationNumber = async () => {
    const counter = await CounterModel.findByIdAndUpdate({_id: 'quotationNo'}, {$inc: {seq: 1}}, {new: true, upsert: true});
    return counter.seq;
}
module.exports={
    getNextQuotationNumber,
}