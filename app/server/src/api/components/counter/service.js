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
    return `NABC${counter.seq + 9}`
}
module.exports={
    getNextQuotationNumber,
    nextInventorySupplier,
    nextCustomerAccount,
}