const mongoose = require('mongoose');
const env = require('./../config.env');

const db = mongoose.connection;
const connectOptions = {
    bufferCommands: false,
    keepAlive: true,
};
// if (env.MONGO_USER && env.MONGO_PASS) {
//     connectOptions['user'] = env.MONGO_USER;
//     connectOptions['pass'] = env.MONGO_PASS;
//     connectOptions['authSource'] = env.MONGO_AUTH_DB;
// }

/*
    mongoose.connection.readyState:
    0   - disconnected
    1   - connected
    2   - connecting
    3   - disconnecting
    99  - uninitialized
*/

db.on('error', (error) => {
    console.error(error);
    mongoose.disconnect();
});
db.on('connected', () => {
    process.stdout.write(`MongoDB Connected: ${env.MONGO_URL}\n`);
});
db.on('reconnectFailed', () => {
    connect();
});

const connect = async () => {
    if (mongoose.connection.readyState !== 1) {
        try {
            await mongoose.connect(env.MONGO_URL, connectOptions);
        } catch (error) {
            // process.stderr.write(error);
        }
    }
};

module.exports = connect;
