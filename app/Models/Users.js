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

const topicsSchema = new mongoose.Schema({
    topicCreatedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'users'},
    topicName: {type: String}
},{
    timestamps: true
});

const topicsPostSchema = new mongoose.Schema({
    topicId: {type: mongoose.Schema.Types.ObjectId, ref: 'topics'},
    postBy: {type: mongoose.Schema.Types.ObjectId, ref: 'users'},
    postName: {type: String},
    postImages: [{type: String}],
    postComments: [{
        commentBy: {type: mongoose.Schema.Types.ObjectId, ref: 'users'},
        comment: {type: String}
    }]
},{
    timestamps: true
});

let Users = mongoose.model('users', users);
let Authentication = mongoose.model('authentications', authSchema);
let Topics = mongoose.model('topics', topicsSchema);
let TopicsPost = mongoose.model('topicsposts', topicsPostSchema);

module.exports = {
    Users, Authentication, Topics, TopicsPost
};