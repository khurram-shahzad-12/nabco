import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Toolbar from '@mui/material/Toolbar';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Link, useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import { menuItems } from '../../configs/NavBarMenuItems';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { Button, CssBaseline, Typography, Box, AppBar, Avatar } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SettingsIcon from '@mui/icons-material/Settings';
import { styled } from '@mui/material/styles';
import Profile from "../Profile/Profile";
import logo from "../../resources/nabco.jpg";
import styles from "./styles.module.css";
import { useAuth } from '../../contexts/AuthContext';
import Cookies from 'universal-cookie';
import SettingsModal from "../SettingsModal/SettingsModal";
import jwtDecode from "jwt-decode";
import { useIdleTimer } from 'react-idle-timer'
import { io } from 'socket.io-client';
import { URL_ROOT } from "../../configs/config";
import { Chat, Token } from '@mui/icons-material';
import Badge from '@mui/material/Badge';
import ChatDialog from '../ChatDialog/ChatDialog';
import { useChatSocket } from '../hooks/useChatSocket';
import testLogo from "../../resources/testserver_logo.jpeg";

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        height: "100%",
        flexGrow: 1,
        padding: theme.spacing(3),
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        marginLeft: `-${drawerWidth}px`,
        ...(open && {
            transition: theme.transitions.create('margin', {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
            }),
            marginLeft: 0,
        }),
    }),
);

const logoDivStyles = {
    height: "130px",
    minHeight: "130px"
};

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
}));

const NavBar = (props) => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading, logout, user, token, hasPermission } = useAuth();
    const [collapseStates, setCollapseStates] = useState({});
    const [drawerOpen, setDrawerOpen] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [userPermissions, setUserPermissions] = useState(null);
    const [state, setState] = useState('Active');
    const [remaining, setRemaining] = useState(0);
    const [socketIO, setSocketIO] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messagesOpen, setMessagesOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [allUsers, setAllUsers] = useState([]);
    const [activeUsers, setActiveUsers] = useState([]);
    const [unreadMap, setUnreadMap] = useState({});
    const [hasMore, setHasMore] = useState(true);
    const [offlineMessagesMap, setOfflineMessagesMap] = useState({});
    const [loadingMore, setLoadingMore] = useState(false);
    const [inactiveUsersWithMessages, setInactiveUsersWithMessages] = useState([]);
    const [otherUsers, setOtherUsers] = useState([]);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [replyTo, setReplyTo] = useState(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const audioRef = useRef(null)
    const cookies = useMemo(() => new Cookies(), []);

    // const token = jwtDecode(cookies.get('apitoken'));
    // const userId = token.id;

    const hasMenuPermission = useCallback((requiredPermissions) => {
        if (!requiredPermissions || requiredPermissions.length === 0) return true;
        return requiredPermissions.some(perm => {
            if (typeof perm === 'string') {
                return hasPermission(perm);
            }
            return false;
        });
    }, [hasPermission]);

    useEffect(() => {
        if (!isAuthenticated || !token) return;
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.id;
        if (isAuthenticated && token) {
            const socket = io(URL_ROOT, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 10000,
                timeout: 120000,
                closeOnBeforeunload: false,
            });
            socket.on("connect", () => {
                socket.emit("REGISTER", [userId, token]);
                socket.emit("GET_ALL_USERS")
            });
            socket.on("LOGOUT", () => {
                socket.disconnect();
                logout();
            });
            setSocketIO(socket);

            return () => {
                socket.disconnect();
            };
        }
    }, [isAuthenticated, token, logout]);

    useChatSocket({
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
    });

    const onIdle = () => {
        setState('Idle');
        isAuthenticated && logout();
    }

    const onActive = () => {
        setState('Active');
    }

    const { getRemainingTime } = useIdleTimer({
        onIdle,
        onActive,
        timeout: process.env.REACT_APP_INACTIVITY_TIMEOUT_MILLISECONDS,
        crossTab: true,
        leaderElection: true,
        syncTimers: 200
    })

    useEffect(() => {
        const interval = setInterval(() => {
            setRemaining(Math.ceil(getRemainingTime() / 1000))
        }, 500)

        return () => {
            clearInterval(interval)
        }
    })

    const logoutUser = async () => {
       if (socketIO) {
        try {
            if (socketIO.connected) {
                socketIO.emit("USER_LOGOUT");
            }
            socketIO.disconnect();
        } catch (error) {
            console.log('Socket disconnect error (ignored):', error);
        }
        setSocketIO(null); // Clear socket state
    }
        await logout();
        navigate('/login');

    }

    // In NavBar.js - Fixed handleClick function
    const handleClick = (name) => {
        setCollapseStates(prev => ({
            ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
            [name]: !prev[name]
        }));
    };

    const handleDrawerOpen = () => {
        setDrawerOpen(true);
    };

    const handleDrawerClose = () => {
        setDrawerOpen(false);
    };

    const sendMessage = useCallback(() => {
        if (!socketIO || !newMessage.trim() || !selectedUser) return;
        const fromUser = jwtDecode(cookies.get("apitoken")).id;
        const msgObj = { senderId: fromUser, receiverId: selectedUser, message: newMessage.trim(), replyTo: replyTo?._id || null };
        socketIO.emit("PRIVATE_MESSAGE", msgObj);
        setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, 100);
        setNewMessage("");
        setReplyTo(null)

    }, [socketIO, newMessage, selectedUser, cookies])

    const categorizeUsers = useCallback((userList, offlineMsgMap) => {
        const myUserId = cookies.get("apitoken") ? jwtDecode(cookies.get("apitoken"))?.id : null;
        if (!myUserId) return { active: [], inactiveWithMessages: [], other: [] };
        const filteredList = userList.filter(user => user.id !== myUserId);
        const active = filteredList.filter(user => user.online === true);
        const inactiveWithMessages = filteredList.filter(user => {
            if (user.online === true) return false;
            return offlineMsgMap[user.id] && offlineMsgMap[user.id].length > 0;
        });
        const other = filteredList.filter(user => {
            if (user.online === true) return false;
            if (inactiveWithMessages.some(u => u.id === user.id)) return false;
            return true;
        });
        return { active, inactiveWithMessages, other };
    }, [cookies]);

    const handleSelectedUser = useCallback((userId) => {
        if (!userId, !socketIO) return;
        setSelectedUser(userId);
        setMessages([]);
        setHasMore(true);
        socketIO.emit("CHAT_OPENED", { withUser: userId })
        setUnreadMap(prev => {
            const copy = { ...prev };
            delete copy[userId]; return copy;
        })
        socketIO.emit("LOAD_CHAT", { withUser: userId });
    }, [socketIO]);

    const loadMoreMessages = useCallback(() => {
        if (!socketIO || !selectedUser || !hasMore || loadingMore) return;
        const oldestMessage = messages[0];
        if (!oldestMessage) return;
        socketIO.emit("LOAD_CHAT", { withUser: selectedUser, before: oldestMessage.createdAt });
    }, [socketIO, selectedUser, hasMore, loadingMore, messages])
    const totalUnread = Object.keys(unreadMap).length;

    useEffect(() => {
        if (messagesOpen && selectedUser) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, messagesOpen, selectedUser]);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container || !selectedUser) return;

        const handleScroll = () => {
            if (container.scrollTop === 0 && hasMore && !loadingMore) {
                setLoadingMore(true);
                loadMoreMessages();
            }
        };
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [hasMore, loadingMore, loadMoreMessages, selectedUser]);

    useEffect(() => {
        if (allUsers.length > 0) {
            const { inactiveWithMessages, other } = categorizeUsers(
                allUsers,
                offlineMessagesMap,
            );
            setInactiveUsersWithMessages(inactiveWithMessages);
            setOtherUsers(other);
        }
    }, [allUsers, offlineMessagesMap, categorizeUsers]);

    useEffect(() => {
        const notificationSound = new Audio('/notification.mp3');
        notificationSound.preload = 'auto';
        notificationSound.volume = 0.8;
        audioRef.current = notificationSound;
        return () => {
            if (notificationSound) {
                notificationSound.pause();
                notificationSound.currentTime = 0;
            }
        }
    }, [])
    return <Box sx={{ display: 'flex', height: "100%" }}>
        <CssBaseline />
        <AppBar position="fixed" open={drawerOpen}>
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    onClick={handleDrawerOpen}
                    edge="start"
                    sx={{ mr: 2, ...(drawerOpen && { display: 'none' }) }}
                >
                    <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                    NABCO DIRECT LTD
                </Typography>
                {/*<span style={{marginRight: "2em"}}>{state}({remaining})</span>*/}
                <SettingsIcon onClick={() => setSettingsOpen(true)} style={{ marginRight: "2em" }} />
                {settingsOpen && <SettingsModal userPreferences={props.userPreferences} updateUserPreferences={props.updateUserPreferences} handleClose={() => setSettingsOpen(false)} />}
                {
                    isAuthenticated &&
                    <Button variant="contained" onClick={logoutUser} endIcon={<LogoutIcon />}>
                        LOGOUT
                    </Button>
                }

            </Toolbar>
        </AppBar>
        <Drawer
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                },
            }}
            variant="persistent"
            anchor="left"
            open={drawerOpen}
        >
            <DrawerHeader style={logoDivStyles}>
                <img src={process.env.REACT_APP_TYPE === "development" ? logo : logo} style={{ width: "100%", height: "100%" }} alt="Nabco Logo" />
                <IconButton onClick={handleDrawerClose}>
                    {drawerOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </IconButton>
            </DrawerHeader>
            <Divider />
            <Profile/>
            {/* {
                process.env.REACT_APP_TYPE === "development" ?
                    <div style={{ background: "red", textAlign: "center" }}>
                        <h3>TESTING</h3>
                    </div>
                    :
                    <></>
            } */}
            <Divider />
            {isAuthenticated ?
                <div>
                    {menuItems.map(parentItem => {
                        const hasParentAccess = hasMenuPermission(parentItem.requiredPermissions);
                        if (!hasParentAccess) return null;
                        const accessibleSubItems = parentItem.subItems?.filter(subItem => hasMenuPermission(subItem.requiredPermissions)) || [];
                        if (accessibleSubItems.length === 0) return null;
                        return (
                            <React.Fragment key={parentItem.name}>
                                <ListItemButton onClick={event => handleClick(parentItem.name)}>
                                    <ListItemIcon>
                                        {parentItem.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={parentItem.name} />
                                    {collapseStates[parentItem.name] ? <ExpandLess /> : <ExpandMore />}
                                </ListItemButton>
                                <Collapse in={collapseStates[parentItem.name]} timeout="auto" unmountOnExit>
                                    {
                                        accessibleSubItems.map(subItem => (
                                            <List component="div" disablePadding key={subItem.name}>
                                                <Link to={`../${parentItem.name}/${subItem.name}`}
                                                    className={props.theme.palette.mode === "dark" ? styles.linkDark : styles.linkLight}>
                                                    <ListItemButton sx={{ pl: 4 }}>
                                                        <ListItemIcon>
                                                            {subItem.icon}
                                                        </ListItemIcon>
                                                        <ListItemText primary={subItem.label} />
                                                    </ListItemButton>
                                                </Link>
                                            </List>
                                        )
                                            
                                        )
                                    }
                                </Collapse>
                            </React.Fragment>
                        )
                    }
                    )}
                    <Divider />
                    <ListItemButton onClick={() => { setMessagesOpen(true); }}>
                        <ListItemIcon>
                            <Badge badgeContent={totalUnread} color='error'><Chat /></Badge>
                        </ListItemIcon>
                        <ListItemText primary='Messages' />
                    </ListItemButton>
                </div>
                :
                <List component="div" disablePadding>
                    <ListItemButton sx={{ pl: 4 }} disabled={isLoading}>
                        <ListItemIcon>
                            <LoginIcon />
                        </ListItemIcon>
                        <ListItemText primary="Login" />
                    </ListItemButton>
                </List>
            }
            <Divider />
        </Drawer>
        <Main open={drawerOpen}>
            <DrawerHeader />
            {props.renderComponent}
        </Main>
        <ChatDialog
            messagesOpen={messagesOpen}
            setMessagesOpen={setMessagesOpen}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            messages={messages}
            setMessages={setMessages}
            hasMore={hasMore}
            setHasMore={setHasMore}
            loadingMore={loadingMore}
            setLoadingMore={setLoadingMore}
            activeUsers={activeUsers}
            inactiveUsersWithMessages={inactiveUsersWithMessages}
            otherUsers={otherUsers}
            unreadMap={unreadMap}
            handleSelectedUser={handleSelectedUser}
            sendMessage={sendMessage}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            messagesContainerRef={messagesContainerRef}
            messagesEndRef={messagesEndRef}
            cookies={cookies}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
        />
    </Box>;
};

export default NavBar;