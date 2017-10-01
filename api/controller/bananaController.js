'use strict';
var mongoose = require('mongoose'),
    User = mongoose.model('User');
const
    codeServerError = 500,
    codeBadRequest = 400,
    codeNotFound = 401,

    msgServerError = "Server Internal Error",
    msgNoEmail = "Please enter your email",
    msgNoPassword = "Please enter your password",
    msgNoConfirmPassword = "Please enter your password confirmation",
    msgPasswordNotMatch = "Passwords do not match",
    msgEmailExist = "This email has been taken",
    msgNoAccount = "Email or password is wrong"
;

const
    codeSuccess = 200,

    msgSuccess = "Success",
    msgAccountCreated = "Account successfully created"
;

exports.getAllUser = function(req, res) {
    User.find({}, function(err, user) {
        if (err)
            return result(res, codeServerError, msgServerError, null);
        return result(res, codeSuccess, msgSuccess, user)
    });
};

exports.createUser = function(req, res) {
    var body = req.body;
    if (!body.email){
       return result(res, codeBadRequest, msgNoEmail , null)
    }
    if (!body.password){
        return result(res, codeBadRequest, msgNoPassword, null)
    }
    if(!body.confirmPassword){
        return result(res, codeBadRequest, msgNoConfirmPassword, null)
    }
    if(body.password !== body.confirmPassword)
        return result(res, codeBadRequest, msgPasswordNotMatch, null);
    var newUser = new User(body);
    User.findOne(
        {
            'email':body.email
        }
        ,function(err,emailExist){
            if(emailExist) { // user exists
                return result(res, codeBadRequest, msgEmailExist, null);
            }
            else{
                newUser.save(function(err, user) {
                    if (err) {
                        console.log(err);
                        return result(res, codeServerError, msgServerError, null)
                    }
                    else {
                        return result(res, codeSuccess, msgAccountCreated, user)
                    }
                });
            }
        }
    );
};

exports.getUserById = function(req, res) {
    User.findById(req.params.userId, function(err, user) {
        if (err)
            return result(res, codeServerError, msgServerError, null);
        return result(res, codeSuccess, msgSuccess, user);
    });
};

exports.updateById = function(req, res) {
    User.findOne({_id: req.params.userId}
        , function(err, userExist) {
        if (err)
            return result(res, codeServerError, msgServerError, null);
        User.insert()
        return result(res, codeSuccess, msgSuccess, user);
    });
};

exports.deleteUserById = function(req, res) {
    User.remove({
        _id: req.params.userId
    }, function(err, user) {
        if (err)
            return result(res, codeServerError, msgServerError, null);
        return result(res, codeSuccess, msgSuccess, user);
    });
};

exports.updatePassword = function (req, res) {
    User.findOneAndUpdate({_id: req.params.userId}, req.body, {new: true}, function(err, user) {
        if (err)
            return result(res, codeServerError, msgServerError, null);
        return result(res, codeSuccess, msgSuccess, user);
    });

}

exports.login = function (req, res) {
    var body = res.body;
    if(!body.email){
        return result(res, codeBadRequest, msgNoEmail, null);
    }
    if(!body.password){
        return result(res, codeBadRequest, msgNoPassword, null);
    }
    User.findOne(
        {
            'email':body.email,
            'password':body.password
        }
        ,function(err,accountExist){
            if(accountExist) { // user exists
                return result(res, codeSuccess, msgSuccess, new res.json({
                    nickname: accountExist.nickname,
                    phone: accountExist.phone,
                    address: accountExist.address,
                    token: "temp"
                }));
            }
            else{
                return result(res, codeNotFound, msgNoAccount, null);
            }
        }
    );
};

function result(res, code, message, body){
    if(!body){
        return res.json({
            code : code,
            message : message
        })
    }
    return res.json({
        code : code,
        message : message,
        body: body
    })
}
