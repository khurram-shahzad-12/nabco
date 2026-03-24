import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, Box, Typography, List, ListItemButton, ListItemText, Avatar, Badge, Button, TextField, CircularProgress } from "@mui/material";
import { Send } from "@mui/icons-material";
import jwtDecode from "jwt-decode";
import { Popover, IconButton } from "@mui/material";
import { SentimentDissatisfied } from "@mui/icons-material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import EmojiPicker from "emoji-picker-react"
import ReplyPopover from "./ReplyPopover";

const ChatDialog = ({
    messagesOpen,
    setMessagesOpen,
    selectedUser,
    setSelectedUser,
    messages,
    setMessages,
    hasMore,
    setHasMore,
    loadingMore,
    setLoadingMore,
    activeUsers,
    inactiveUsersWithMessages,
    otherUsers,
    unreadMap,
    handleSelectedUser,
    sendMessage,
    newMessage,
    setNewMessage,
    messagesContainerRef,
    messagesEndRef,
    cookies,
    replyTo,
    setReplyTo,
}) => {
    const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
    const [menuAnchorE1, setMenuAnchorE1] = useState(null);
    const [selectedMessageForAction, setSelectedMessageForAction] = useState(null);
    const openEmojiPicker = Boolean(emojiAnchorEl);

    const handleToggleEmojiPicker = (event) => {
        setEmojiAnchorEl(event.currentTarget);
    };

    const handleCloseEmojiPicker = () => {
        setEmojiAnchorEl(null);
    };

    const handleEmojiClick = (emojiData) => {
        setNewMessage(prev => prev + emojiData.emoji);
    };
    return (
        <Dialog open={messagesOpen}
            onClose={() => { setMessagesOpen(false); setSelectedUser(null); setMessages([]); setHasMore(true); setLoadingMore(false); }}
            fullWidth
            maxWidth="md"
            sx={{ '& .MuiDialog-paper': { height: '80vh' } }}
        >
            <DialogTitle>
                {process.env.REACT_APP_AUTH0_DOMAIN.startsWith("development-spice-direct")?'SDW Chat':'Nabco Chat'}
            </DialogTitle>
            <DialogContent sx={{ p: 0, display: 'flex', height: '100%', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
                    <Box sx={{ minWidth: "280px", borderRight: '1px solid', borderColor: 'divider', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                            {activeUsers.length > 0 && (
                                <>
                                    <Typography variant='subtitle2' sx={{ pl: 2, pt: 1, color: 'text.secondary', fontWeight: 'bold' }}>Online Users</Typography>
                                    {activeUsers.map(user => (
                                        <ListItemButton
                                            key={user.id}
                                            selected={selectedUser === user.id}
                                            onClick={() => { handleSelectedUser(user.id) }}
                                            sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}
                                        >
                                            <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'green' }}>{user.name?.[0]?.toUpperCase() || "U"}</Avatar>
                                            <ListItemText primary={<>{user.name}{unreadMap[user.id] && (<Badge sx={{ ml: 1.5, mb: 2 }} badgeContent={unreadMap[user.id]} color='error' />)}</>} />
                                        </ListItemButton>
                                    ))}
                                </>)}
                            {inactiveUsersWithMessages.length > 0 && (
                                <>
                                    <Typography variant='subtitle2' sx={{ pl: 2, pt: 1, color: 'text.secondary', fontWeight: 'bold' }}>Messages</Typography>
                                    {inactiveUsersWithMessages.map(user => (
                                        <ListItemButton
                                            key={user.auth0Id}
                                            selected={selectedUser === user.auth0Id}
                                            onClick={() => { handleSelectedUser(user.auth0Id) }}
                                            sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', pl: 2 }}
                                        >
                                            <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'orange' }}>
                                                {user.user_name?.[0]?.toUpperCase() || "M"}
                                            </Avatar>
                                            <ListItemText
                                                primary={<>
                                                    {user.user_name}
                                                    {unreadMap[user.auth0Id] && (
                                                        <Badge
                                                            sx={{ ml: 1.5 }}
                                                            badgeContent={unreadMap[user.auth0Id]}
                                                            color='error'
                                                        />
                                                    )}
                                                </>}
                                                secondary="Has unread messages"
                                                secondaryTypographyProps={{ fontSize: 12, color: 'orange' }}
                                            />
                                        </ListItemButton>
                                    ))}
                                </>
                            )}
                            {otherUsers.length > 0 && (<><Typography variant="subtitle2" sx={{ pl: 2, pt: 1, color: 'text.secondary', fontWeight: 'bold' }}>All Users</Typography>
                                {otherUsers.map(user => (
                                    <ListItemButton
                                        key={user.auth0Id}
                                        selected={selectedUser === user.auth0Id}
                                        onClick={() => { handleSelectedUser(user.auth0Id) }}
                                        sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', pl: 2 }}
                                    >
                                        <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'grey' }}>
                                            {user.user_name?.[0]?.toUpperCase() || "O"}
                                        </Avatar>
                                        <ListItemText
                                            primary={user.user_name}
                                            secondary="Offline"
                                            secondaryTypographyProps={{ fontSize: 12, color: 'orange' }}
                                        />
                                    </ListItemButton>
                                ))}
                            </>
                            )}
                            {activeUsers.length === 0 && inactiveUsersWithMessages.length === 0 && otherUsers.length === 0 && (
                                <Typography sx={{ p: 2, textAlign: 'center' }}>No users found</Typography>
                            )}
                        </List>
                    </Box>
                    <Box sx={{ flexGrow: 1, padding: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {selectedUser ? (
                            <>
                                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                                    <Avatar sx={{ mr: 1 }}>{activeUsers.find(u => u.id === selectedUser)?.name?.[0]?.toUpperCase() || "U"}</Avatar>
                                    <Typography variant="subtitle1">
                                        {activeUsers.find(u => u.id === selectedUser)?.name || otherUsers.find(u => u.auth0Id === selectedUser)?.user_name || selectedUser}
                                    </Typography>
                                </Box>
                                <Box ref={messagesContainerRef} sx={{ flexGrow: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column' }}>
                                    {loadingMore && (<Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}><CircularProgress size={20} /></Box>)}
                                    {messages.map((msg, index) => {
                                        const myUserId = cookies.get("apiToken") ? jwtDecode(cookies.get("apiToken")).sub : null;
                                        const isMyMessage = msg.senderId === myUserId;
                                        return (
                                            <Box key={msg._id || index}
                                                sx={{ display: 'flex', justifyContent: isMyMessage ? "flex-end" : "flex-start", mb: 1 }}
                                            >
                                                <Box
                                                    sx={{
                                                        maxWidth: '70%',
                                                        bgcolor: isMyMessage ? 'lightgreen' : 'white',
                                                        color: isMyMessage ? 'black' : 'black',
                                                        py: 0.5, px: 2,
                                                        borderRadius: 2,
                                                        boxShadow: 1,
                                                        borderTopLeftRadius: isMyMessage ? 12 : 2,
                                                        borderTopRightRadius: isMyMessage ? 2 : 12,
                                                        wordBreak: 'break-word',
                                                        whiteSpace: 'pre-wrap',
                                                        ...(!isMyMessage && { position: "relative", pr: 5, })
                                                    }}
                                                >

                                                    {msg.replyTo && (
                                                        <Box sx={{ bgcolor: "#f0f0f0", p: 1, mb: 0.5, borderLeft: '3px solid gray', borderRadius: 1, fontSize: '0.75rem', opacity: 0.8 }}>{msg.replyTo.message}</Box>
                                                    )}
                                                    <Typography variant='body2'>{msg.message}</Typography>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            display: 'block',
                                                            opacity: 0.7,
                                                            textAlign: 'right',
                                                            fontSize: '0.6rem'
                                                        }}
                                                    >
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                        {isMyMessage && msg.delivered && !msg.seen && ' ✓'}
                                                        {isMyMessage && msg.seen && ' ✓✓'}
                                                    </Typography>
                                                    {!isMyMessage && (<ExpandMoreIcon sx={{ position: 'absolute', right: 8, top: 8, cursor: 'pointer' }} onClick={(e) => { setMenuAnchorE1(e.currentTarget); setSelectedMessageForAction(msg) }} />)}
                                                    <ReplyPopover
                                                        menuAnchorE1={menuAnchorE1}
                                                        setMenuAnchorE1={setMenuAnchorE1}
                                                        selectedMessageForAction={selectedMessageForAction}
                                                        setReplyTo={setReplyTo}
                                                        disableEnforceFocus
                                                    />
                                                </Box>
                                            </Box>
                                        )
                                    })}
                                    <div ref={messagesEndRef} />
                                </Box>
                                <Box sx={{ display: 'flex', mt: 1, borderColor: 'divider', p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'end' }}><IconButton onClick={handleToggleEmojiPicker}><SentimentDissatisfied /></IconButton></Box>
                                    <Popover
                                        open={openEmojiPicker}
                                        anchorEl={emojiAnchorEl}
                                        onClose={handleCloseEmojiPicker}
                                        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                                        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                        disableEnforceFocus
                                        disableAutoFocus
                                        disablePortal
                                    ><EmojiPicker onEmojiClick={handleEmojiClick} /></Popover>
                                    <Box sx={{ width: "80%" }}>
                                        {replyTo && (
                                            <Box sx={{ bgcolor: '#f5f5f5', p: 1, mb: 1, borderRadius: 1, display: 'flex', alignItems: 'flex-start', color: 'black', gap: 1, position: 'relative' }}>
                                                <Typography sx={{ color: 'green' }}>Reply:</Typography>
                                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{replyTo.message}</Typography>
                                                <IconButton size="small" sx={{ p: 0.5, color: 'black', position: 'absolute', top: 0, right: 0 }} onClick={() => { setReplyTo(null) }}><CloseIcon /></IconButton>
                                            </Box>
                                        )}
                                        <TextField
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            placeholder="Type your message..."
                                            multiline
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    sendMessage();
                                                }
                                            }}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'end' }}><Button
                                        variant="contained"
                                        sx={{ ml: 1 }}
                                        onClick={sendMessage}
                                        endIcon={<Send />}
                                    >
                                        Send
                                    </Button></Box>
                                </Box>
                            </>
                        ) : (
                            <Box sx={{
                                flexGrow: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Typography color="text.secondary">
                                    Select a user to start chatting
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default ChatDialog;
