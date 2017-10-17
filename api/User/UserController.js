'use strict';
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    passwordHash = require('password-hash'),
    jwt = require('jsonwebtoken');
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
    msgWrongEmail = "Email not found",
    msgWrongPassword = "Password is incorrect"
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
        return result(res, codeSuccess, msgSuccess, ({
            email:user.email,
            nickname:user.nickname,
            address:user.address,
            phone:user.phone,
            created_at:user.created_at
        }))
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
                newUser.password = passwordHash.generate(newUser.password);
                newUser.confirmPassword = passwordHash.generate(newUser.confirmPassword);

                console.log(newUser.password);
                console.log(newUser.confirmPassword);

                newUser.save(function(err, user) {
                    if (err) {
                        console.log(err);
                        return result(res, codeServerError, msgServerError, null)
                    }
                    else {
                        return result(res, codeSuccess, msgAccountCreated, ({
                            _id:user._id,
                            email:user.email,
                            nickname:user.nickname,
                            address:user.address,
                            phone:user.phone,
                            created_at:user.created_at
                        }))
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
        return result(res, codeSuccess, msgSuccess, ({
            _id:userExist._id,
            email:userExist.email,
            nickname:userExist.nickname,
            address:userExist.address,
            phone:userExist.phone,
            created_at:userExist.created_at
        }));
    });
};

exports.updateById = function(req, res) {
    var body = req.body;
    User.findByIdAndUpdate(req.params.userId, body,{new: true}, function (err, user) {
        if(!user)
            return result(res, codeNotFound, msgUserNotFound, null);
        if(err)
            return result(res, codeServerError, msgServerError, null);
        return result(res, codeSuccess, msgSuccess, ({
            _id:user._id,
            email:user.email,
            nickname:user.nickname,
            address:user.address,
            phone:user.phone,
            created_at:user.created_at
        }));
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
                    return result(res, codeSuccess, msgSuccess, ({}));
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

            userExist.password = passwordHash.generate(body.newPassword);
            userExist.confirmPassword = passwordHash.generate(body.confirmPassword);

            return result(res, codeSuccess, msgSuccess, ({
                _id:user._id,
                email:user.email,
                nickname:user.nickname,
                address:user.address,
                phone:user.phone,
                created_at:user.created_at
            }));
        });
    });

};

exports.login = function (req, res) {
    console.log(req.body);
    var body = req.body;
    if(!body.email){
        return result(res, codeBadRequest, msgNoEmail, null);
    }
    if(!body.password){
        return result(res, codeBadRequest, msgNoPassword, null);
    }

    User.findOne(
        {
            email:body.email
        }
        ,function(err,accountExist){
            if(err) {
                return result(res, codeServerError, msgServerError, null);
            }
            if(accountExist) { // user exists
                if(!passwordHash.verify(body.password,accountExist.password)) //checkPassword
                    return result(res, codeNotFound, msgWrongPassword, null);
                const payload = {
                    _id:accountExist._id,
                    nickname: accountExist.nickname,
                    email:accountExist.email,
                    phone: accountExist.phone,
                    address: accountExist.address
                };
                //generate tokens
                var tokenResponse = jwt.sign(payload, "minionAndGru", {
                    expiresIn: 4320 // expires in 72 hours
                });
                return result(res,codeSuccess,msgSuccess, {
                    token:tokenResponse,
                    _id:accountExist._id,
                    nickname: accountExist.nickname,
                    phone: accountExist.phone,
                    address: accountExist.address
                });
            }
            else{
                return result(res, codeNotFound, msgWrongEmail, null);
            }
        }
    );
};

function result(res, code, message, body){
    var isSuccess = code == codeSuccess;
    if(!body){
        return res.json({
            success:isSuccess,
            code : code,
            message : message
        })
    }
    return res.json({
        success:isSuccess,
        code : code,
        message : message,
        data: body
    })
}
function resultWithToken(res,token,body){
    return res.json({
        success:true,
        message: msgSuccess,
        token: token,
        data: body
    })
}
