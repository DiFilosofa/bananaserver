'use strict';
var mongoose = require('mongoose'),
    utils = require('../../Utils/MainUtils.js'),
    User = mongoose.model('User'),
    Point = mongoose.model('PointByMonth'),
    passwordHash = require('password-hash'),
    jwt = require('jsonwebtoken'),
    code = require('../../Data/Code.js'),
    msg = require('../../Data/Message.js');
;

exports.getAllUser = function(req, res) {
    User.find({}, function(err, user) {
        if (err)
            return utils.result(res, code.serverError, msg.serverError, null);
        return utils.result(res, code.success, msg.success, ({
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
       return utils.result(res, code.badRequest, msg.noEmail , null)
    }
    if (!body.password){
        return utils.result(res, code.badRequest, msg.noPassword , null)
    }
    if(!body.confirmPassword){
        return utils.result(res, code.badRequest, msg.noConfirmPassword , null)
    }
    if(body.password !== body.confirmPassword)
        return utils.result(res, code.badRequest, msg.passwordNotMatch , null)
    var newUser = new User(body);
    User.findOne(
        {
            'email':body.email
        }
        ,function(err,emailExist){
            if(emailExist) { // user exists
                return utils.result(res, code.badRequest, msg.emailExist , null)
            }
            else{
                newUser.password = passwordHash.generate(newUser.password);
                newUser.confirmPassword = passwordHash.generate(newUser.confirmPassword);

                newUser.save(function(err, user) {
                    if (err) {
                        console.log(err);
                        return utils.result(res, code.serverError, msg.serverError, null)
                    }
                    else {

                        var point = new Point({
                            userId:user._id,
                            month:(new Date()).getUTCMonth(),
                            year:(new Date()).getUTCFullYear()
                        });
                        point.save(function(err){
                            if (err) {
                                console.log(err);
                                return utils.result(res, code.serverError, msg.serverError, null)
                            }
                        });
                        return utils.result(res, code.success, msg.accountCreated, ({
                            _id:user._id,
                            email:user.email,
                            nickname:user.nickname,
                            address:user.address,
                            phone:user.phone,
                            created_at:user.created_at,
                            Point:point
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
            return utils.result(res, code.notFound, msg.userNotFound, null);
        }
        if(err) {
            console.log(err);
            return utils.result(res, code.serverError, msg.serverError, null)
        }
        Point.find({userId:userExist._id},
            function (err,pointResult) {
                if(err) {
                    console.log(err);
                    return utils.result(res, code.serverError, msg.serverError, null)
                }
                else {
                    return utils.result(res, code.success, msg.success, ({
                        _id:userExist._id,
                        email:userExist.email,
                        nickname:userExist.nickname,
                        address:userExist.address,
                        phone:userExist.phone,
                        created_at:userExist.created_at,
                        Point:pointResult
                    }));
                }
            }
        );

    });
};

exports.updateById = function(req, res) {
    var body = req.body;
    User.findByIdAndUpdate(req.params.userId, body,{new: true}, function (err, user) {
        if(!user)
            return utils.result(res, code.notFound, msg.userNotFound, null);
        if(err)
            return utils.result(res, code.serverError, msg.serverError, null)
        return utils.result(res, code.success, msg.success, ({
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
            return utils.result(res, code.serverError, msg.serverError, null)
        }
        if(userExist) {
            User.remove({
                _id:req.params.userId
            }, function (err, deleted) {
                if(!deleted){
                    return utils.result(res, code.notFound, msg.userNotFound, null);
                }
                if(err) {
                    return utils.result(res, code.serverError, msg.serverError, null)
                }
                if(deleted){
                    return utils.result(res, code.success, msg.success, ({}));
                }
            });
        }
        else{
            return utils.result(res, code.notFound, msg.userNotFound, null);
        }
    });
};

exports.updatePassword = function (req, res) {
    User.findOne({
        _id:req.params.userId
    }, function (err,userExist) {
        if(!userExist) {
            return utils.result(res, code.notFound, msg.userNotFound, null);
        }
        if(err) {
            console.log(err);
            return utils.result(res, code.serverError, msg.serverError, null)
        }
        var body = req.body;
        if(!body.password)
            return utils.result(res, code.badRequest, msg.noOldPassword, null);
        if(!body.newPassword)
            return utils.result(res, code.badRequest, msg.noNewPassword, null);
        if(!body.confirmPassword)
            return utils.result(res, code.badRequest, msg.noConfirmPassword, null);
        if(userExist.password !== body.password)
            return utils.result(res, code.badRequest, msg.incorrectOldPassword, null);
        if(body.newPassword !== body.confirmPassword)
            return utils.result(res, code.badRequest, msg.passwordNotMatch, null);
        userExist.update({
            password:body.newPassword,
            confirmPassword:body.confirmPassword
        },{new:true},function (err,user) {
            if(err)
                return utils.result(res, code.serverError, msg.serverError, null)

            userExist.password = passwordHash.generate(body.newPassword);
            userExist.confirmPassword = passwordHash.generate(body.confirmPassword);

            return utils.result(res, code.success, msg.success, ({
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
        return utils.result(res, code.badRequest, msg.noEmail, null);
    }
    if(!body.password){
        return utils.result(res, code.badRequest, msg.noPassword, null);
    }

    User.findOne(
        {
            email:body.email
        }
        ,function(err,accountExist){
            if(err) {
                return utils.result(res, code.serverError, msg.serverError, null);
            }
            if(accountExist) { // user exists
                if(!passwordHash.verify(body.password,accountExist.password)) //checkPassword
                    return utils.result(res, code.notFound, msg.wrongPassword, null);
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
                return utils.result(res,code.success,msg.success, {
                    token:tokenResponse,
                    _id:accountExist._id,
                    nickname: accountExist.nickname,
                    phone: accountExist.phone,
                    address: accountExist.address
                });
            }
            else{
                return utils.result(res, code.notFound, msg.wrongEmail, null);
            }
        }
    );
};