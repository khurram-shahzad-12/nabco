const Message = require('./model');
const ChatUser = require("../chat_users/model");

exports.createMessage = async ({senderId, receiverId, text, replyTo}) => {
    try {
        if(!senderId ||!receiverId ||!text) {throw new Error("missing required fields for creating new message")}
        const newMessage = await Message.create({senderId, receiverId, message: text, replyTo: replyTo || null}); 
        await newMessage.populate("replyTo");
        return newMessage;   
    } catch (error) {console.log("Error creating message:", error); throw error}
}
exports.getOfflineMessages = async(userId) => {
    try {
        if(!userId) {throw new Error("UserId is required")}
        return await Message.find({receiverId: userId, seen: false}).sort({createdAt: 1}).populate("replyTo", "message senderId createdAt").lean();
    } catch (error) {console.log("Error getting offline messages: ", error); throw error}
}
exports.offlineDeliveredMessages = async (messageIds) => {
    try {
        if(!Array.isArray(messageIds) || messageIds.length === 0) return 0;
        await Message.updateMany({_id: {$in: messageIds}},{$set: {delivered: true, deliveredAt: new Date()}});
    } catch (error) {console.log("Error marking offline messages as delivered", error); throw error }
}
exports.markDelivered = async (messageId) => {
    try {
        if(!messageId){throw new Error("messageId is required for markdelivered")}
        return await Message.findByIdAndUpdate(messageId, {delivered: true, deliveredAt: new Date()})
    } catch (error) {console.log("Error making message as delivered:", error); throw error }
}
exports.markSeen = async({senderId, receiverId}) => {
    try {
        if(!senderId ||!receiverId){throw new Error("missing required field for mark seen")}
        return await Message.updateMany({senderId, receiverId, seen: false}, {$set: {seen: true, seenAt: new Date()}})
    } catch (error) {console.log("Error making messages as seen:", error); throw error }
}
exports.getChatHistory = async ({userA, userB, before, limit = 50}) => {
    try {
        if(!userA ||!userB){throw new Error("Both userA and and userB are required for chat history")}
        const query = { $or:[{ senderId: userA, receiverId: userB },{ senderId: userB, receiverId: userA }]}
        if (before) { query.createdAt = {$lt: new Date(before)}};
        return await Message.find(query).sort({createdAt: -1}).limit(limit).populate("replyTo", "message senderId createdAt").lean();
    } catch (error) { console.log("Error getting chat history:", error); throw error }

}

