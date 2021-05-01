var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true, limit: '50mb'}));
app.use(bodyParser.json());
const Configs = require('./configs/configs');
var path = require('path');
var cors = require('cors');
// Connect to DB:
require('./services/db');
app.get('/', (req, res, next) => {
    return res.send(`Openexcell task 2`);
})
app.use(cors());
/* Configuring Routes */
var Users = require('./app/Routes/Users');
app.use('/', Users);

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
global.imageRoot = path.resolve(__dirname);
app.use('/public', express.static(__dirname + '/public'));

app.listen(process.env.PORT || Configs.portNo, (error) => {
    if(error){
        console.log(`Error while starting server on : ${Configs.portNo}`);
    }
    else{
        console.log(`Server started on : ${Configs.portNo}`);
    }
});