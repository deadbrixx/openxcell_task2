let mongoose = require('mongoose');
let Config = require('../configs/configs');
// Connect to the DB :
let connect =  mongoose.connect(Config.dbUrl, {useNewUrlParser: true, useUnifiedTopology: true}, (error, connect) => {
    if(error){
        console.log('Error while database connection');
    }
    else{
        console.log('Databse connected successfully');
    }
});
module.exports = connect;
