 const mongoose = require('mongoose');
// 用于记录每一关的信息和结果
let customPassSchema = new mongoose.Schema({
    userid: {
        type: String,
        required: true,
    },
    wordPass: {
        type: Array,
        default: {
            word: String,
            mistake: Number
        }
    },
    spellP: {
        type: Array,
        default: [
            {
                word: String,
                mistake: Number
            }
        ]
    },
    listenP: {
        type: Array,
        default: [
            {
                word: String,
                mistake: Number
            }
        ]
    }
    ,
    customsP: {
        type: Object,
        default: {
            audio_script: String,
            fill_in_the_blanks: Array
        }
    },
    creatTime: {
        type: Date,
        default: Date.now
    }

})
const CustomsPass = mongoose.model('customsPass', customPassSchema);
module.exports = CustomsPass;