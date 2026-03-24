const ChatUser = require("../api/components/chat_users/model");
const MESSAGE_SERVICE = require("../api/components/messages/service");

class ChatHandler {
    constructor(io, userSockets, userMap, env, getUserNameFromAuth0AndStoreInMap) {
        this.io = io;
        this.userSockets = userSockets;
        this.userMap = userMap;
        this.env = env;
        this.getUserNameFromAuth0AndStoreInMap = getUserNameFromAuth0AndStoreInMap
    }
    updateActiveUsers() {
        const activeUserList = Array.from(this.userSockets.keys()).map(userID => ({
            id: userID,
            name: this.userMap[userID] || userID
        }));
        this.io.emit("ACTIVE_USERS", activeUserList);
    }
    async handleRegister(userID, userToken, socket) {
        try {
            socket.userId = userID;
            if(!this.userSockets.has(userID)){this.userSockets.set(userID, new Set())};
            this.userSockets.get(userID).add(socket);
            const user_name = this.userMap[userID];
            if(!this.userMap[userID]){this.getUserNameFromAuth0AndStoreInMap(userToken)}
            await ChatUser.findOneAndUpdate({auth0Id: userID},{auth0Id: userID, online: true, last_seen: new Date(), user_name}, {upsert: true});
            const offlineMessages = await MESSAGE_SERVICE.getOfflineMessages(userID);
            if(offlineMessages.length) {
                const userSocket = this.userSockets.get(userID);
                if(userSocket){
                    userSocket.forEach(sock => {
                        sock.emit("OFFLINE_MESSAGES", offlineMessages);
                    })
                }
                const messageIds = offlineMessages.map(m => m._id);
                await MESSAGE_SERVICE.offlineDeliveredMessages(messageIds);
                offlineMessages.forEach(msg => {
                    const senderSocketSet = this.userSockets.get(msg.senderId);
                    if(senderSocketSet) {
                        senderSocketSet.forEach(sock => {
                            sock.emit("MESSAGE_DELIVERED", msg._id);
                        });
                    }
                })
            }
            this.updateActiveUsers();
        } catch (error) {console.error('Error in handleRegister:', error);}
    }
    async handlePrivateMessage({receiverId, message, replyTo}, socket) {
        try {
            const senderId = socket.userId;
            if(!receiverId ||!message) {console.log("Missing req fields"); return}
            const savedMessage = await MESSAGE_SERVICE.createMessage({senderId, receiverId, text: message, replyTo});
            const senderSocketSet = this.userSockets.get(senderId);
            if(senderSocketSet){
                senderSocketSet.forEach(sock => {
                    sock.emit("PRIVATE_MESSAGE", savedMessage);
                })
            }
            const targetSocketSet = this.userSockets.get(receiverId);
            if(targetSocketSet && targetSocketSet.size > 0) {
                targetSocketSet.forEach(sock => {
                    sock.emit("PRIVATE_MESSAGE", savedMessage);
                })
                await MESSAGE_SERVICE.markDelivered(savedMessage._id);
                if(senderSocketSet) {
                    senderSocketSet.forEach(sock => {
                        sock.emit("MESSAGE_DELIVERED", savedMessage._id)
                    })
                }
            }else{
                if(senderSocketSet){
                    senderSocketSet.forEach(sock => {
                        sock.emit("USER_OFFLINE", {receiverId})
                    })
                }}
        } catch (error) {console.log("Error in handlePrivateMessage: ", error)
            
        }
    }
    async handleChatOpened ({withUser}, socket) {
        try {
            const myId = socket.userId;
            await MESSAGE_SERVICE.markSeen({senderId: withUser, receiverId: myId});
            const senderSocketSet = this.userSockets.get(withUser);
            if(senderSocketSet) {
                senderSocketSet.forEach(sock => {
                    sock.emit("MESSAGE_SEEN", {by: myId})
                })
            }
        } catch (error) {console.log("Error in handleChatOpened: ",error)  }
    }
    async handleLoadChat({withUser, before}, socket) {
        try {
            const myId = socket.userId;
            const Limit = 50;
            const history = await MESSAGE_SERVICE.getChatHistory({userA : myId, userB: withUser, before, limit: Limit})
            socket.emit("CHAT_HISTORY", {messages: history, hasMore: history.length === Limit});
            if(!before){ await MESSAGE_SERVICE.markSeen({senderId: withUser, receiverId: myId})}
        } catch (error) { console.log("Error in handleLoadChat:", error)   }
    }
    async handleDisconnect(socket, reason) {
        try {
            const userId = socket.userId;
            if(userId) { 
                const userSocketSet = this.userSockets.get(userId);
                if(userSocketSet){
                    userSocketSet.delete(socket);
                    if(userSocketSet.size === 0){
                        this.userSockets.delete(userId);
                        await ChatUser.findOneAndUpdate({auth0Id: userId}, {online: false, last_seen: new Date()})
                    }
                }
            }
            this.updateActiveUsers();
        } catch (error) { console.log("Error in handleDisconnect: ", error)};
    }
    async handleGetAllUsers(socket) {
        try {
            const users = await ChatUser.find({});
            socket.emit("ALL_USERS", users);
        } catch (error) { console.log("Error in handleGetAllUsers", error)}
    }
    async handleOfflineDelivered (messageIds) {
        try {
            await MESSAGE_SERVICE.offlineDeliveredMessages(messageIds)
        } catch (error) { console.log("Error in handleOfflineDelivered", error)}
    }
    async handleUserLogout (socket) {
        try {
            const userId = socket.userId;
            if(userId){
                const userSocketSet = this.userSockets.get(userId);
                if(userSocketSet) {
                    userSocketSet.clear();
                    this.userSockets.delete(userId);
                     await ChatUser.findOneAndUpdate({auth0Id: userId}, {online: false, last_seen: new Date()})
                }
            }
            this.updateActiveUsers();
        } catch (error) { console.log("Error in handleUserLogout socket: ", error) }
    }
}
module.exports = ChatHandler