var express = require('express');
var app = express();
var database = require('mongodb');
var bodyParser = require('body-parser');
var API_CONSTANT = "gYqqZQHORiIrJewS";
var dbUrl = process.env.BANANA_DB_URL;
var mongoClient = database.MongoClient;

var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});
app.get('/', function (req, res) {
    res.status(200).send('WELCOME TO BANANA');
})
app.get('/test', function (req, res) {
    res.status(200).send('testID');
})
