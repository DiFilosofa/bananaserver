var express = require('express');
var app = express();
var database = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var API_CONSTANT = "gYqqZQHORiIrJewS";
var dbUrl = process.env.BANANA_DB_URL;
var mongoClient = database.MongoClient;

var routes = require('./api/Routes.js');

//Schemas registration
var EventFeedback = require('./api/TrafficEvent/Feedback/FeedbackModel.js'),
    Cluster = require('./api/TrafficEvent/Cluster/ClusterModel.js'),
    UserModel = require('./api/User/UserModel.js'),
    TrafficEvent = require('./api/TrafficEvent/TrafficEventModel.js'),
    GPSData = require('./api/TrafficEventLocation/TrafficEventLocationModel.js'),
    TrafficEventPoint = require('./api/TrafficEvent/Points/TrafficEventPointModel.js'),
    PointByMonth = require('./api/User/Points/PointModel.js')
;

var configDB = require('./config/BananaConst.js');
var jwt = require('jsonwebtoken');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.set('bananaMinion', configDB.secret); // secret variable

routes(app);

mongoose.Promise = global.Promise;
mongoose.connect(configDB.url);

// connect to our database// mongoose.connect('mongodb://localhost/bananaserver');

var server = app.listen(process.env.PORT || 3500, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});