import { useEffect } from "react";
import jwtDecode from "jwt-decode";

export const useChatSocket = ({
    socketIO,
    cookies,
    isAuthenticated,
    messagesOpen,
    selectedUser,
    offlineMessagesMap,
    loadingMore,
    setMessages,
    setUnreadMap,
    setActiveUsers,
    setAllUsers,
    setOfflineMessagesMap,
    setHasMore,
    setLoadingMore,
    messagesEndRef,
    audioRef,
    soundEnabled,
}) => {

    useEffect(() => {
        if (!socketIO || !isAuthenticated) return;
        const myUserId = jwtDecode(cookies.get("apiToken")).sub;
        const handleActiveUsers = (users) => {
            const filteredUsers = users.filter(user => user.id !== myUserId)
            setActiveUsers(filteredUsers);
            setAllUsers(prev => prev.map(user => ({
                ...user,
                online: filteredUsers.some(activeUser => activeUser.id === user.auth0Id),
            })))
        }
        const handleAllUsers = (users) => {
            const filteredUsers = users.filter(user => user.auth0Id !== myUserId);
            setAllUsers(filteredUsers);
        };

        const handlePrivateMessage = (msg) => {
            if (messagesOpen && selectedUser === msg.senderId || msg.receiverId === selectedUser) {
                setMessages(prev => {
                    if (prev.some(m => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });
                setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, 100);
                socketIO.emit("CHAT_OPENED", { withUser: msg.senderId });
            } else {
                if (msg.senderId !== myUserId) {
                    setUnreadMap(prev => ({
                        ...prev,
                        [msg.senderId]: (prev[msg.senderId] || 0) + 1
                    }));
                    if(soundEnabled && audioRef?.current) {
                        try {
                            audioRef.current.currentTime = 0;
                            audioRef.current.play().catch(e => {console.log("autoplay error: ", e.name)})
                        } catch (error) { console.log("sound play error: ", error)}
                    }
                }
            }
        }
        const handleOfflineMessages = msgs => {
            if (!msgs || !Array.isArray(msgs)) return;
            const groupedBySender = {};
            msgs.forEach(msg => {
                if (!groupedBySender[msg.senderId]) { groupedBySender[msg.senderId] = [] }
                groupedBySender[msg.senderId].push(msg)
            });
            setOfflineMessagesMap(prev => {
                const updated = { ...prev };
                Object.keys(groupedBySender).forEach(senderId => {
                    if (!updated[senderId]) {
                        updated[senderId] = [];
                    }
                    updated[senderId] = [...updated[senderId], ...groupedBySender[senderId]];
                });
                return updated;
            })

            setUnreadMap(prev => {
                const updated = { ...prev }
                msgs.forEach(msg => {
                    if (messagesOpen && selectedUser === msg.senderId) {
                    } else {
                        updated[msg.senderId] = (updated[msg.senderId] || 0) + 1;
                    }
                });
                return updated
            });
        };

        const handleChatHistory = ({ messages, hasMore }) => {
            if (!selectedUser) return;
            setLoadingMore(false);
            setHasMore(hasMore);
            setMessages(prevMessages => {
                if (!loadingMore) {
                    const offlineForThisChat = offlineMessagesMap[selectedUser] || [];
                    const map = new Map();
                    [...messages, ...offlineForThisChat].forEach(m => map.set(m._id, m));
                    const merged = Array.from(map.values()).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                    return merged;
                }
                else {
                    const existingIds = new Set(prevMessages.map(m => m._id));
                    const newMessages = messages.filter(msg => !existingIds.has(msg._id));
                    return [...newMessages, ...prevMessages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                }
            });
            if (!loadingMore) {
                setOfflineMessagesMap(prev => {
                    const updated = { ...prev };
                    delete updated[selectedUser];
                    return updated;
                });
            }
            if (!loadingMore) {
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
                }, 100);
            }
        };
        const handleMessageDelivered = messageId => {
            setMessages(prev => prev.map(m =>
                m._id === messageId ? { ...m, delivered: true } : m
            ))
        }
        const handleMessageSeen = ({ by }) => {
            setMessages(prev => prev.map(m => m.receiverId === by ? { ...m, seen: true } : m))
        }
        socketIO.on("ACTIVE_USERS", handleActiveUsers);
        socketIO.on("ALL_USERS", handleAllUsers);
        socketIO.on("PRIVATE_MESSAGE", handlePrivateMessage);
        socketIO.on("OFFLINE_MESSAGES", handleOfflineMessages);
        socketIO.on("CHAT_HISTORY", handleChatHistory);
        socketIO.on("MESSAGE_DELIVERED", handleMessageDelivered);
        socketIO.on("MESSAGE_SEEN", handleMessageSeen);
        return () => {
            socketIO.off("ACTIVE_USERS", handleActiveUsers);
            socketIO.off("ALL_USERS", handleAllUsers);
            socketIO.off("PRIVATE_MESSAGE", handlePrivateMessage);
            socketIO.off('OFFLINE_MESSAGES', handleOfflineMessages);
            socketIO.off("MESSAGE_DELIVERED", handleMessageDelivered);
            socketIO.off("MESSAGE_SEEN", handleMessageSeen);
            socketIO.off("CHAT_HISTORY", handleChatHistory)
        };
    }, [socketIO, messagesOpen, selectedUser, isAuthenticated, offlineMessagesMap, loadingMore, cookies, audioRef, soundEnabled]);
};
