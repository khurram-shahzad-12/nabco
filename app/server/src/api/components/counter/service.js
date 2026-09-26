const CounterModel = require('./model');

const getNextQuotationNumber = async () => {
    const counter = await CounterModel.findByIdAndUpdate({_id: 'quotationNo'}, {$inc: {seq: 1}}, {new: true, upsert: true});
    return counter.seq;
}

const nextInventorySupplier = async () => {
    const counter = await CounterModel.findByIdAndUpdate({_id: "inventorySupplierAccountNO"}, {$inc: {seq: 1}}, {new: true, upsert: true})
    return `NAB${counter.seq + 9}`
}

const nextCustomerAccount = async () => {
    const counter = await CounterModel.findByIdAndUpdate({_id: "customerAccountNo"}, {$inc: {seq: 1}}, {new: true, upsert: true});
    return `NABCO${counter.seq + 3000}`
}

const getArticleNo = async(key) => {
    const result = await CounterModel.findByIdAndUpdate(key, {$inc: {seq: 1}}, {new: true, upsert: true});
    return result.seq;
}
module.exports={
    getNextQuotationNumber,
    nextInventorySupplier,
    nextCustomerAccount,
    getArticleNo,
}