const User = require('../Models/Users').Users;
const _ = require('lodash');
const ObjectId = require('mongodb').ObjectID;
const Service = require('../../services/Middleware');
const Topics = require('../Models/Users').Topics;
const TopicPosts = require('../Models/Users').TopicsPost;
class Users{
  
  /* Register */
    async register(req){
        try {
            // Check fields validator :
            let requiredArr = ["userName", "emailId", "password"];
            let checkFields = await Service.checkRequiredFields(requiredArr, req.body);
            if(!_.isEmpty(checkFields)){
                return {
                    status: 401,
                    message: `Please send required fields : ${checkFields}`
                };
            }
            else{
                // Check email and userName is already exists :
                let checkWithFields = await User.find({$or: [{emailId: req.body.emailId}, {userName: req.body.userName}]});
                if(!_.isEmpty(checkWithFields)){
                    return {
                        status: 402,
                        message: `User is already exist with provided Email or Username`
                    };
                }
                else{
                    // Encrypt the password :
                    req.body.password = await Service.encryptPassword(req.body.password);
                    // Process the body data (Store in Db): 
                    await User.create(req.body);
                    // Send Email to the register user :
                    let isSent = await Service.sendEmail(req.body.emailId);
                    if(isSent){
                        // Successfull response :
                        return {
                            status: 200,
                            message: `Registration successfully`
                        };
                    }
                    else{
                        return {
                            status: 200,
                            message: `Registration successfully, Sending Email...`
                        };
                    }
                }
            }
        } catch (error) {
            console.log('register-error', error);
            return {
                status: 500,
                message: 'Internal server error'
            };
        }
    }

    /* Login */
    async login(req){
        try {
            // Check fields validator :
            let requiredArr = ["emailId", "password"];
            let checkFields = await Service.checkRequiredFields(requiredArr, req.body);
            if(!_.isEmpty(checkFields)){
                return {
                    status: 401,
                    message: `Please send required fields : ${checkFields}`
                };
            }
            else{
                // Check is user exist or not ?
                let checkUser = await User.findOne({emailId: req.body.emailId});
                if(_.isEmpty(checkUser)){
                    return {
                        status: 401,
                        message: `No User exist with given Email`
                    };
                }
                else{
                    const isPasswordVerified = await Service.decryptPassword({ password: req.body.password, storedPassword: checkUser.password });
                    if(!isPasswordVerified){
                        return {
                            status: 400,
                            message: `Wrong password`
                        };
                    }
                    else{
                        // Generate token :
                        let tokenGenerateData = { userId: checkUser._id };
                        let accessToken = await Service.generateToken(tokenGenerateData);
                        return {
                            status: 200,
                            message: 'Login successfully',
                            token: accessToken,
                            data: {
                                _id: checkUser._id,
                                userName: checkUser.userName,
                                emailId: checkUser.emailId
                            }
                        };
                    }
                }
            }
        } catch (error) {
            console.log('login-error', error);
            return {
                status: 500,
                message: 'Internal server error'
            };
        }
    }

    /* Create Topic */
    async createTopic(req){
        try {
            // Check fields validator :
            let requiredArr = ["topicName", "topicCreatedBy"];
            let checkFields = await Service.checkRequiredFields(requiredArr, req.body);
            if(!_.isEmpty(checkFields)){
                return {
                    status: 401,
                    message: `Please send required fields : ${checkFields}`
                };
            }
            else{
                await Topics.create(req.body);
                return {
                    status: 200,
                    message: 'Topic has been created successfully'
                };
            }
        } catch (error) {
            console.log('createTopic-error', error);
            return {
                status: 500,
                message: 'Internal server error'
            };
        }
    }

    /* Create Topic Post*/
    async createTopicPost(req){
        try {
            // Parse the request as we are using form-data to upload data and images :
            let reqDataParse = await Service.parseRequest(req);
            // Check fields validator :
            let requiredArr = ["postBy", "topicId", "postName"];
            let checkFields = await Service.checkRequiredFields(requiredArr, reqDataParse.fields);
            if(!_.isEmpty(checkFields)){
                return {
                    status: 401,
                    message: `Please send required fields : ${checkFields}`
                };
            }
            else{
                let findTheTopic = await Topics.findOne({_id: ObjectId(reqDataParse.fields.topicId[0])});
                if(_.isEmpty(findTheTopic)){
                    return {
                        status: 400,
                        message: `No Topic found`
                    };
                }
                let postObj = {
                    postBy: reqDataParse.fields.postBy[0],
                    postName: reqDataParse.fields.postName[0],
                    topicId: reqDataParse.fields.topicId[0]
                };
                let postImages = await Service.storeImage(reqDataParse.files);
                if(!_.isEmpty(postImages)){
                    postObj.postImages = postImages;
                }
                // Store the posts
                await TopicPosts.create(postObj);
                return {
                    status: 200,
                    message: 'Topic post has been added successfully'
                };
            }
        } catch (error) {
            console.log('createTopicPost-error', error);
            return {
                status: 500,
                message: 'Internal server error'
            };
        }
    }

    /* Comment on Topic's Post*/
    async commentOnPost(req){
        try {
            // Check fields validator :
            let requiredArr = ["postId", "comment", "commentBy"];
            let checkFields = await Service.checkRequiredFields(requiredArr, req.body);
            if(!_.isEmpty(checkFields)){
                return {
                    status: 401,
                    message: `Please send required fields : ${checkFields}`
                };
            }
            else{
                let findThePosts = await TopicPosts.findOne({_id: ObjectId(req.body.postId)});
                if(_.isEmpty(findThePosts)){
                    return {
                        status: 400,
                        message: `No Posts found`
                    };
                }
                else{
                    // Store the comment
                    let commentObj = {comment: req.body.comment, commentBy: req.body.commentBy};
                    await TopicPosts.updateOne({_id: ObjectId(req.body.postId)}, {$push: {postComments: commentObj}});
                    return {
                        status: 200,
                        message: 'Comment has been added on the post successfully'
                    };
                }
            }
        } catch (error) {
            console.log('commentOnPost-error', error);
            return {
                status: 500,
                message: 'Internal server error'
            };
        }
    }
    
    /* Get All Topics */
    async getTopics(req){
        try {
            let limit = req.query && req.query.pageSize ? Number(req.query.pageSize) : 10;
            let skip = req.query && req.query.page ? (Number(req.query.page) - 1) * limit : 0;
            let findAllTopics = await Topics.find({}).populate("topicCreatedBy", {userName: 1}).skip(skip).limit(limit);
            return {
                status: 200,
                message: 'Topics fetched successfully',
                data: findAllTopics
            };
        } catch (error) {
            console.log('getTopics-error', error);
            return {
                status: 500,
                message: 'Internal server error'
            };
        }
    }

    /* Get All Post and comment for Topics */
    async getTopicPosts(req){
        try {
            let limit = req.query && req.query.pageSize ? Number(req.query.pageSize) : 10;
            let skip = req.query && req.query.page ? (Number(req.query.page) - 1) * limit : 0;
            let findAllTopicsPosts = await TopicPosts.find({}, {postName: 1, postComments: 1}).populate("topicId", {topicName: 1}).skip(skip).limit(limit);
            return {
                status: 200,
                message: 'Posts and Comment fetched successfully',
                data: findAllTopicsPosts
            };
        } catch (error) {
            console.log('getTopicPosts-error', error);
            return {
                status: 500,
                message: 'Internal server error'
            };
        }
    }

}

module.exports = Users;