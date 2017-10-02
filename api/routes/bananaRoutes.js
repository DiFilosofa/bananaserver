'use strict';
module.exports = function(app) {
    var users = require('../controller/bananaController');

    app.route('/').get(function (req,res) {
        res.send("Server is up and running")
        });

    // Account
    app.route('/user')
        .get(users.getAllUser)
        .post(users.createUser);
    app.route('/user/password/:userId')
        .put(users.updatePassword);
    app.route('/user/login')
        .post(users.login);
    app.route('/user/:userId')
        .get(users.getUserById)
        .put(users.updateById)
        .delete(users.deleteUserById);
};