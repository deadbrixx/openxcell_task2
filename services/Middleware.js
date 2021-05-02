const _ = require('lodash');
const Configs = require('../configs/configs');
const User = require('../app/Models/Users').Users;
const Authentication = require('../app/Models/Users').Authentication;
const Moment = require('moment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const multiparty = require('multiparty');
const mv = require('mv');

module.exports = {

    // Parse the request data :
    async parseRequest(req) {
        return new Promise(async (resolve, reject) => {
            try {
                let dataParse = new multiparty.Form();
                dataParse.parse(req, (err, fields, files) => {
                    if (err) {
                        return reject({ message: err, status: 0 });
                    }
                    let parseObj = {};
                    parseObj.fields = fields;
                    parseObj.files = files;
                    return resolve(parseObj);
                });
            } catch (error) {
                return reject(error);
            }
        });
    },

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
    },

    // Add Auth middleware function :
    async isAuth(req, res, next){
        let authToken = req.headers.authorization;
        if(_.isEmpty(authToken)){
            return res.send({
                status: 401,
                message: `Please send token`
            })
        }
        // Is token present in our db
        let tokenDetails = Buffer.from(authToken, 'binary').toString();
        var decoded = jwt.verify(tokenDetails, 'OpenXcell@123', { ignoreExpiration: true });
        if (!decoded) { 
            return res.send({
                status: 401,
                message: `Invalid token`
            });
        }
        const authenticate = await Authentication.findOne({ token: tokenDetails });
        if (_.isEmpty(authenticate)){
            return res.send({
                status: 401,
                message: `Invalid token`
            });
        }
        else{
            // Is token not expired :
            let expiryDate = Moment(authenticate.tokenExpiryTime, 'YYYY-MM-DD HH:mm:ss')
            let now = Moment(new Date(), 'YYYY-MM-DD HH:mm:ss');
            if (expiryDate < now) {
                return res.send({
                    status: 401,
                    message: `Token expired`
                });
            }
            next();
        }
    },

    // Store post images :
    async storeImage(images){
        return new Promise(async (resolve, reject) => {
            let imageArr = images.image;
            let postImages = [];
            let imagePath = '/public/';
            if(imageArr && imageArr.length){
                // Process original image :
                imageArr.map(images => {
                    let fileName = images.originalFilename.split(".");
                    let fileExt = _.last(fileName);
                    let imageName = 'post_' + Date.now().toString() + '.' + fileExt;
                    let filePath = imagePath + imageName;
                    postImages.push(filePath);
                    mv(images.path, imageRoot + filePath, { mkdirp: true }, async function (err) {
                        if(err){
                            console.log('Error while storing images');
                            reject(0);
                        }
                    });
                });
            }
            resolve(postImages);
        });
    }

};