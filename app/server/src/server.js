const env = require('./config.env');
const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');;
const { Server } = require("socket.io");

const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
const createError = require('http-errors');

const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./db/connect');
const {authenticate} = require("./middleware/auth");
const {verifyToken} = require("./api/components/authentication/user/service");
const routesAPI = require('./routes');

const cron = require('node-cron');
const SERVICE_CUSTOMER_CANCELLED_INVOICES_DAY = require('./api/components/customerCancelledInvoicesDay/service');
const SERVICE_CUSTOMER_TEMPORARY_ORDERS_DAY = require('./api/components/customerTemporaryOrdersDay/service');
const SERVICE_CUSTOMER_CALLBACK_TIMERS = require('./api/components/customerCallbackTimers/service');
const moment = require('moment');
const {manageUsersPermission} = require("./middleware/auth0");
const spiceDirectAppOrders = require('./utils/spicedirectcron');
const SERVICE_INVENTORY = require("./api/components/inventory/service");
const ChatHandler = require("./utils/chatHandler")

let userMap = {};
const userSockets = new Map();

const app = express();
let io;
const corsOptions = {
  origin: ['http://localhost:3000', 'https://localhost:8000', 'http://localhost', 'https://nabco.sdw-ds.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
const startupCallback = () => {
    process.stdout.write(`${Date().toString()}\n`);
    process.stdout.write(`Environment: ${env.NODE_ENV}\n`);
    process.stdout.write(`Port: ${env.PORT}\n`);
    process.stdout.write(`TLS: ${env.useTLS}\n`);
    process.stdout.write(`Helmet: ${env.useHELMET}\n`);
    process.stdout.write(`CORS: ${env.useCORS}\n`);
    process.stdout.write(`Emails Enabled: ${env.EMAIL_ENABLED}\n`);
    process.stdout.write(`Allowed content-src: ${env.CONTENT_SRC_ALLOWED}\n`);
    connectDB();

    const cleanupCancelledInvoicesDaysTask = cron.schedule('0 1 * * *', async () => {
        const todayDate = moment().format('YYYY-MM-DD');
        const previousCustomerCancelledInvoicesDay = await SERVICE_CUSTOMER_CANCELLED_INVOICES_DAY.fetchCustomerCancelledInvoicesBeforeDate(todayDate);
        previousCustomerCancelledInvoicesDay.forEach(item => SERVICE_CUSTOMER_CANCELLED_INVOICES_DAY.deleteCustomerCancelledInvoicesDay(item._id));
    });
    cleanupCancelledInvoicesDaysTask.start();

    const cleanupTemporaryOTDaysTask = cron.schedule('0 1 * * *', async () => {
        const todayDate = moment().format('YYYY-MM-DD');
        const previousCancelledOTCustomers = await SERVICE_CUSTOMER_TEMPORARY_ORDERS_DAY.fetchTemporaryCustomersBeforeDate(todayDate);
        previousCancelledOTCustomers.forEach(item => SERVICE_CUSTOMER_TEMPORARY_ORDERS_DAY.deleteCustomerTemporaryOrdersDay(item._id));
    });
    cleanupTemporaryOTDaysTask.start();

    const cleanupCustomerCallbackTimers = cron.schedule('0 2 * * *', async () => {
        const todayDate = moment().format('YYYY-MM-DD');
        const previousCustomerCallbackTimers = await SERVICE_CUSTOMER_CALLBACK_TIMERS.fetchCustomerCallbackTimersBeforeDate(todayDate);
        previousCustomerCallbackTimers.forEach(item => SERVICE_CUSTOMER_CALLBACK_TIMERS.deleteCustomerCallbackTimer(item._id));
    });
    cleanupCustomerCallbackTimers.start();

    const cleanupPDFFolder = cron.schedule('*/15 * * * *', async () => {
        fs.readdir('PDF', (err, files) => {
            files.forEach(file => {
                const filePath = `PDF/${file}`;
                fs.lstat(filePath, (err, fileStat) => {
                    if(fileStat.isDirectory()) {
                        const timeCreated = moment(fileStat.atime);
                        const timeNow = moment();
                        const minutesSinceFolderCreation = timeNow.diff(timeCreated, 'minutes');
                        if(minutesSinceFolderCreation >= 15) {
                            fs.rm(filePath, {recursive: true}, () => {});
                        }
                    }
                })
            });
        });
    });
    cleanupPDFFolder.start();
    spiceDirectAppOrders.getOrdersFromSpiceDirectApp.start();
    spiceDirectAppOrders.cancelOrdersFromSpiceDirectApp.start();
};

const getUserFromJWT = (req) => {
    let returnName = 'UNKNOWN USER';
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            if (decoded) {
                if (decoded.firstName && decoded.lastName) {
                    const fullName = [decoded.firstName, decoded.lastName].filter(Boolean).join(' ');
                    returnName = fullName;
                } else if (decoded.email) {
                    returnName = decoded.email;
                }
            }
        }
    } catch (error) {
        console.error('Error getting user from JWT:', error);
    }
    
    return returnName;
};

if (env.useHELMET) {
    app.use(
        helmet.contentSecurityPolicy({
            directives: {
                'default-src': ['\'self\''],
                'img-src': ['\'self\'', 'data:','https://maps.gstatic.com','https://maps.googleapis.com','https://s.gravatar.com','https://cdn.jsdelivr.net' ,...env.CSP_IMG_SRC],
                'script-src': ['\'self\'',
                    'https://maps.googleapis.com', 'https://maps.gstatic.com', "'unsafe-inline'"
                ],
                'style-src': ["'self'",'https://fonts.googleapis.com',"'unsafe-inline'"],
                'connect-src': ["'self'", ...env.CONTENT_SRC_ALLOWED],
                'font-src': ["'self'",'data:','https://fonts.static.com'],
                'object-src': ["'none'"],
                'frame-ancestors': ["'self'"],
            },
        }),
    );
}
if (env.useCORS) {app.use(cors(corsOptions)); app.options('*', cors(corsOptions))};
app.use(xss());
app.use(mongoSanitize());

app.use(express.static('public'));
app.use(express.static('build'));
app.use(express.json());
app.use(express.json({limit: '50mb'}));
app.use(cookieParser());

app.use(compression());
//logging config
// app.use(morgan(env.LOG_LEVEL));
// app.use(morgan('[:date[clf]] :referrer :remote-addr :method :url status::status :response-time ms - :res[content-length]'));
app.use(morgan(function (tokens, req, res) {
    const user = getUserFromJWT(req);
    return [
        `[${tokens.date(req, res, 'clf')}]`,
        user,
        tokens['remote-addr'](req, res),
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens['response-time'](req, res), 'ms', '-',
        tokens.res(req, res, 'content-length')
    ].join(' ')
}));

app.get('/api/inventory/image/:id', async (req, res, next) => {
    try {
        res.send(await SERVICE_INVENTORY.getInventoryImage(req.params.id));
    } catch (e) {
        next(e);
    }
});
app.use('/api', routesAPI);
app.get('/api/admin/activeUsers',authenticate, manageUsersPermission, (req, res) => {
    const activeUsers = Array.from(userSockets.keys()).map(key => {
        return {
            name: userMap[key] ? userMap[key] : key,
            id: key
        }
    });
    res.send(activeUsers);
});

app.post('/api/admin/logOutUser',authenticate, manageUsersPermission, (req, res) => {
    const targetUser = req.body;
    const targetSockets = userSockets.get(targetUser.id);
    if(targetSockets && targetSockets.size > 0) {
        targetSockets.forEach(socket => {
            socket.emit("LOGOUT", "")
        });
        userSockets.delete(targetUser.id);
        res.sendStatus(200);
    } else {
        console.error(`User ${targetUser.id} not currently in active list`);
        res.sendStatus(500);
    }
});

app.use((_req, _res, next) => next(createError(404)));
app.use(errorHandler);

const socketOnConnection = (socket) => {
    const chatHandler = new ChatHandler(io, userSockets, userMap, env)
    socket.on('REGISTER', async (args) => {
        try {
            await chatHandler.handleRegister(args[0], args[1], socket);
        } catch (error) { console.log("socket register error: ", error)}
    });
    socket.on("GET_ALL_USERS", async () => {
        try {
            await chatHandler.handleGetAllUsers(socket)
        } catch (error) {console.log('Get all user error: ', error) }
    })
    socket.on("PRIVATE_MESSAGE", async(data) => {
        try {
            await chatHandler.handlePrivateMessage(data, socket);
        } catch (error) { console.log("Private Message Error: ", error)}
    })
    socket.on("CHAT_OPENED", async(data) => {
       try {
        await chatHandler.handleChatOpened(data, socket)
       } catch (error) { console.log("chat Open Error: ", error)}
    })
    socket.on("OFFLINE_DELIVERED", async(messageIds) => {
        try {
            await chatHandler.handleOfflineDelivered(messageIds);
        } catch (error) { console.log("offline delivered message error: ", error) }
    })
    socket.on('LOAD_CHAT', async(data)=>{
       try {
        await chatHandler.handleLoadChat(data, socket)
       } catch (error) { console.log("Load Chat Error: ", error)}
    });
    socket.on("disconnect", async reason => {
        try {
            await chatHandler.handleDisconnect(socket, reason)
        } catch (error) { console.log('disconnect error: ', error)}
    });
    socket.on("USER_LOGOUT", async () => {
        try {
            await chatHandler.handleUserLogout(socket)
        } catch (error) { console.log("user logout error: ", error) }
    })
};
const socketOptions = {
    pingTimeout: 120000, pingInterval: 30000, connectTimeout: 45000, transport: ['websocket', 'polling'],
}

if (env.useTLS) {
    const credentials = {
        key: fs.readFileSync(env.TLS_KEY, 'utf8'),
        cert: fs.readFileSync(env.TLS_CERT, 'utf8'),
    };
    const httpsServer = https.createServer(credentials, app);
    io = env.NODE_ENV === 'development' ? new Server(httpsServer, {...socketOptions, cors: { origin: "http://localhost:3000" }}) : new Server(httpsServer, socketOptions);
    io.on('connection', socketOnConnection);
    httpsServer.listen(env.PORT, startupCallback);
} else {
    const httpServer = http.createServer(app);
    io = new Server(httpServer, socketOptions);
    io.on('connection', socketOnConnection);
    httpServer.listen(env.PORT, startupCallback);
}