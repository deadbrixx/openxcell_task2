const User = require('../Models/Users').Users;
const _ = require('lodash');
const ObjectId = require('mongodb').ObjectID;
const Service = require('../../services/Middleware');
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
}

module.exports = Users;