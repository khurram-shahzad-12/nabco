const ChatUser = require("./model");
const database = require('./../../../db/database');
const createError = require("http-errors");
const ChatMessage = require("../messages/model");


const fetchChatUsers= (query = {}, projection = {}, sort = {user_name: 1}, limit = 0) => {
    return database.find(ChatUser, query, projection, sort, limit);
};
const deleteChatUser = async(id) => {
    const user = await database.findOne(ChatUser, {_id: id});
    if(!user) {throw createError(404, "chat user not found");}
    const auth0Id = user.auth0Id;
    await ChatMessage.deleteMany({$or: [{senderId: auth0Id}, {receiverId: auth0Id}]});
    await database.findByIdAndDelete(ChatUser, id);
    return {success: true};
};

module.exports = {
    fetchChatUsers,
    deleteChatUser,
};
