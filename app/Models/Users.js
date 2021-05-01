const mongoose = require('mongoose');
const users = new mongoose.Schema({
    userName: {type: String},
    emailId: {type: String},
    password: {type: Buffer}
}, {
    timestamps: true
});

const authSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'users'},
    token: {type: Buffer},
    isTokenExpired: { type: Boolean, default: false },
    tokenExpiryTime: { type: Date }
},{
    timestamps: true
});

let Users = mongoose.model('users', users);
let Authentication = mongoose.model('authentications', authSchema);

module.exports = {
    Users, Authentication
};