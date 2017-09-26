var express = require('express');
var app = express();

var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});
app.get('/', function (req, res) {
    res.status(200).send('WELCOME TO BANANA');
})