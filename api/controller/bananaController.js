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
    msgNoOldPassword = "Please enter your old password",
    msgNoNewPassword = "Please enter your new password",
    msgIncorrectOldPassword = "The old password is incorrect",
    msgEmailExist = "This email has been taken",
    msgUserNotFound = "User not found",
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
    User.findOne({
        _id:req.params.userId
    }, function (err,userExist) {
        if(!userExist) {
            return result(res, codeNotFound, msgUserNotFound, null);
        }
        if(err) {
            console.log(err);
            return result(res, codeServerError, msgServerError, null);
        }
        return result(res, codeSuccess, msgSuccess, userExist);
    });
};

exports.updateById = function(req, res) {
    var body = req.body;
    User.findByIdAndUpdate(req.params.userId, body,{new: true}, function (err, user) {
        if(!user)
            return result(res, codeNotFound, msgUserNotFound, null);
        if(err)
            return result(res, codeServerError, msgServerError, null);
        return result(res, codeSuccess, msgSuccess, user);
    });
};

exports.deleteUserById = function(req, res) {
    User.findOne({
        _id:req.params.userId
    }, function (err,userExist) {
        if(err) {
            return result(res, codeServerError, msgServerError, null);
        }
        if(userExist) {
            User.remove({
                _id:req.params.userId
            }, function (err, deleted) {
                if(!deleted){
                    return result(res, codeNotFound, msgUserNotFound, null);
                }
                if(err) {
                    return result(res, codeServerError, msgServerError, null);
                }
                if(deleted){
                    return result(res, codeSuccess, msgSuccess, null);
                }
            });
        }
        else{
            return result(res, codeNotFound, msgUserNotFound, null);
        }
    });
};

exports.updatePassword = function (req, res) {
    User.findOne({
        _id:req.params.userId
    }, function (err,userExist) {
        if(!userExist) {
            return result(res, codeNotFound, msgUserNotFound, null);
        }
        if(err) {
            console.log(err);
            return result(res, codeServerError, msgServerError, null);
        }
        var body = req.body;
        if(!body.password)
            return result(res, codeBadRequest, msgNoOldPassword, null);
        if(!body.newPassword)
            return result(res, codeBadRequest, msgNoNewPassword, null);
        if(!body.confirmPassword)
            return result(res, codeBadRequest, msgNoConfirmPassword, null);
        if(userExist.password !== body.password)
            return result(res, codeBadRequest, msgIncorrectOldPassword, null);
        if(body.newPassword !== body.confirmPassword)
            return result(res, codeBadRequest, msgPasswordNotMatch, null);
        userExist.update({
            password:body.newPassword,
            confirmPassword:body.confirmPassword
        },{new:true},function (err,user) {
            if(err)
                return result(res, codeServerError, msgServerError, null);
            /////////////////////////////////////
            userExist.password = body.newPassword;
            userExist.confirmPassword = body.confirmPassword;
            ////////////////////////////////////
            return result(res, codeSuccess, msgSuccess, userExist);
        });
    });

};

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
