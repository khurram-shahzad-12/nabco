const connect = require('./connect');

const database = {
    create: async (Model, document) => {
        await connect();
        return Model.create([document], {validateBeforeSave: true});
    },
    exists: async (Model, query) => {
        await connect();
        return Model.exists(query);
    },
    find: async (Model, query, projection, sort, limit) => {
        await connect();
        const documents = Model.find(query).select(projection).sort(sort).limit(limit).lean();
        return documents.exec();
    },
    findOne: async (Model, query, projection, limit) => {
        await connect();
        const documents = Model.findOne(query).select(projection).limit(limit).lean();
        return documents.exec();
    },
    findByIdAndDelete: async (Model, id) => {
        await connect();
        return Model.findByIdAndDelete(id);
    },
    findByIdAndUpdate: async (Model, id, update) => {
        await connect();
        return Model.findByIdAndUpdate(id, update, {new: true, runValidators: true}).lean();
    },
    findByIdAndUpdateNoValidate: async (Model, id, update) => {
        await connect();
        return Model.findByIdAndUpdate(id, update, {new: true, runValidators: false}).lean();
    },
};

module.exports = database;
