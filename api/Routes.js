'use strict';
var express = require('express');
var jwt = require('jsonwebtoken');
module.exports = function (app) {
    var users = require('./User/UserController');
    var events = require('./TrafficEvent/TrafficEventController');
    var cluster = require('./TrafficEvent/Cluster/ClusterController');
    var apiRoutes = express.Router();
    apiRoutes.get('/', function (req, res) {
        res.send("Server is up and running")
    });

    // Account
    apiRoutes.post('/user', users.createUser);
    apiRoutes.post('/user/login', users.login);
    apiRoutes.get('/user', users.getAllUser);
    apiRoutes.get('/eventsAll/:userId', events.getAllEvents);
    apiRoutes.get('/events/:eventId', events.getEventById);
    apiRoutes.get('/leaderboard', users.getLeaderboardAllTime);
    apiRoutes.get('/leaderboard/month/:time', users.getLeaderboardByMonth);
    apiRoutes.get('/leaderboard/year/:year', users.getLeaderboardByYear);
    apiRoutes.get('/clustersAll/:userId', cluster.getAllCluster);

    apiRoutes.use(function (req, res, next) {
        // check header or url parameters or post parameters for token
        var token = req.headers['authorization'];
        console.log(req.headers);
        // decode token
        if (token) {
            // verifies secret and checks exp
            jwt.verify(token, app.get('bananaMinion'), function (err, decoded) {
                if (err) {
                    return res.json({success: false, message: 'Token expired'});
                } else {
                    // if everything is good, save to request for use in other routes
                    req.decoded = decoded;
                    next();
                }
            });
        } else {
            // if there is no token
            // return an error
            return res.status(403).send({
                success: false,
                message: 'No token provided.'
            });

        }
    });

    apiRoutes.get('/user', users.getAllUser);
    apiRoutes.put('/user/password/:userId', users.updatePassword);
    apiRoutes.get('/user/:userId', users.getUserById);
    apiRoutes.put('/user/:userId', users.updateById);
    apiRoutes.put('/user/avatar/:userId', users.updateUserAvatarById);
    apiRoutes.delete('/user/:userId', users.deleteUserById);

    apiRoutes.post('/events', events.createEvent);
    apiRoutes.put('/events/media/:eventId', events.updateEventPhotos);
    apiRoutes.put('/events/:eventId', events.updateEventById);
    apiRoutes.delete('/events/:eventId', events.deleteEvent);
    apiRoutes.post('/events/upvote/:eventId',events.vote);

    app.use(apiRoutes);
};