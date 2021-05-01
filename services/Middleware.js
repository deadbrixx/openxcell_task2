const _ = require('lodash');
const Configs = require('../configs/configs');
const User = require('../app/Models/Users').Users;
const Authentication = require('../app/Models/Users').Authentication;
const Moment = require('moment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
module.exports = {

    // Check Required fields :
    async checkRequiredFields(requiredArr, reqBody){
        return new Promise((resolve, reject) => {
            let hasFields = [];
            requiredArr.map((keys) => {
                if(_.isEmpty(reqBody[keys])){
                    hasFields.push(keys);
                }
            });
            resolve(hasFields);
        });
    },

    // Encrypt the password :
    async encryptPassword(password){
        return new Promise(async (resolve, reject) => {
            return resolve(bcrypt.hashSync(password, 10));
        });
    },

    // Email send :
    async sendEmail(userEmail){
        return new Promise(async (resolve, reject) => {
            // Create Nodemailer transporter object (SMTP) :
            let dummyAccount = await nodemailer.createTestAccount();
            let transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                  user: dummyAccount.user, 
                  pass: dummyAccount.pass
                },
            });

            let registerEmailObj = {
                from: 'ashidavv@gmail.com',
                to: userEmail,
                subject: "New user Registration",
                text: "Thanks for registering with us !",
                html: "<h3>Let's join our team, and be a part of our incredible team.</h3>"
            };
            await transporter.sendMail(registerEmailObj, (error, sent) => {
                if(error){
                    console.log('error-Mail sent', error);
                    reject(false);
                }
                else{
                    console.log('sent---', sent);
                    resolve(true);
                }
            });
        });
    },

    // Decrypt password
    async decryptPassword(passwords){
        return new Promise(async (resolve, reject) => {
            let isPasswordVerified = false;
            if (passwords && passwords.password && passwords.storedPassword) {
                let base64data = Buffer.from(passwords.storedPassword, 'binary').toString();
                isPasswordVerified = await bcrypt.compareSync(passwords.password, base64data);
            }
            return resolve(isPasswordVerified);
        });
    },

    // Generate User token 
    async generateToken(tokenData){ // We can use some other libraries to generate tokens :
        return new Promise(async (resolve, reject) => {
            let token = jwt.sign({
                id: tokenData.userId,
                algorithm: "HS256",
                exp: Math.floor(Date.now() / 1000) + 361440
            }, 'OpenXcell@123');
            tokenData.token = token;
            tokenData.userId = tokenData.userId;
            tokenData.tokenExpiryTime = Moment().add(540, 'minutes');
            /* Find Auth token */
            const auth = await Authentication.findOne({ userId: tokenData.userId });
            if (_.isEmpty(auth)) {
                await Authentication.create(tokenData);
            } else {
                await Authentication.findByIdAndUpdate(auth._id, tokenData, { new: true });
            }
            return resolve(token);
        });
    }

};