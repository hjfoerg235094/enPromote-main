const mongoose = require('mongoose');
let conversationSchema = new mongoose.Schema({
    userid: {
        type: String,
        required: true,
    },
    character: {
        type: String,
        default: 'general'
    }
    ,
    scene: {
        type: String,
        default: 'general'
    },
    message: [{
        role: String,
        content: String,
        timestamp: Date
    }],
    engilsh: {
        type: Boolean,
        default: false
    },
    createTime: {
        type: Date,
        default: Date.now
    }
})
const Conver = mongoose.model('conversation', conversationSchema);
module.exports = Conver;