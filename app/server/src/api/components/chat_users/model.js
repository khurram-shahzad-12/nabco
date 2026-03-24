const mongoose = require('mongoose');
const MODEL_NAME = 'ChatUser';
const COLLECTION_NAME = 'chatusers';

const SCHEMA_CUSTOMER = new mongoose.Schema({
    auth0Id:  {type: String, required: false, trim: true, unique: true},
    user_name:  {type: String, trim: true,},
    last_seen:       {type: Date},
    online:        {type: Boolean},
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

const ChatUser = mongoose.model(MODEL_NAME, SCHEMA_CUSTOMER);
module.exports = ChatUser;
