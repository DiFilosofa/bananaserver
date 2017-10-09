var express = require('express');
var app = express();
var database = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var API_CONSTANT = "gYqqZQHORiIrJewS";
var dbUrl = process.env.BANANA_DB_URL;
var mongoClient = database.MongoClient;

var userRoutes = require('./api/User/UserRoutes.js');
var trafficEventRoutes = require('./api/TrafficEvent/Main/TrafficEventRoutes.js');
var GPSDataRoutes = require('./api/GPSData/GPSDataRoutes.js');

var User = require('./api/User/UserModel.js');
var TrafficEvent  = require('./api/TrafficEvent/Main/TrafficEventModel.js');
var GPSData = require('./api/GPSData/GPSDataModel.js');

var configDB = require('./config/BananaConst.js');
var jwt = require('jsonwebtoken');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('bananaMinion', configDB.secret); // secret variable

userRoutes(app);
trafficEventRoutes(app);

mongoose.Promise = global.Promise;
mongoose.connect(configDB.url);

// connect to our database// mongoose.connect('mongodb://localhost/bananaserver');

var server = app.listen(process.env.PORT || 3500, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});
//
// app.get('/', function (req, res) {
//     res.status(200).send('WELCOME TO BANANA');
// });
// app.get('/test', function (req, res) {
//     res.status(200).send('testID');
// });