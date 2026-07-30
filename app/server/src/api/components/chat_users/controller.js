const SERVICE_CHAT_USER = require('./service');
const validate = require('../../../utils/validate');
const extractProperties = require('./../../../utils/extractProperties');

const allowedModifiableProperties = ['user_name'];
const buildQuery = (req) => {
    const QUERY = {};
    if (req.params.id && validate.id(req.params.id)) QUERY._id = req.params.id;
    return QUERY;
};

const getChatUsers = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CHAT_USER.fetchChatUsers(buildQuery(req)));
    } catch (e) {next(e);}
};
const deleteChatUser = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CHAT_USER.deleteChatUser(validate.id(req.params.id)));
    } catch (e) {next(e);}
};

module.exports = {
    getChatUsers,
    deleteChatUser,
};
