'use strict';
var mongoose = require('mongoose'),
    UserPoint = mongoose.model('PointByMonth'),
    User = mongoose.model('User')
;

exports.createNewPoint = function (userId) {
    //find a user
    //if user exist, check if point for new month exist
    //if PointByMonth exist -> skip
    //else create
    User.findOne({_id:userId},function (err,user) {
        if(err){
            console.log(err);
            return null;
        }
        if(!user){
            return null;
        }

        UserPoint.findOne({
            month:(new Date()).getUTCMonth(),
            year:(new Date()).getUTCFullYear()
        },function (err,result) {
            if(err){
                console.log(err);
                return null;
            }
            if(!result){
                (new UserPoint({
                    userId:userId,
                    month:(new Date()).getUTCMonth(),
                    year:(new Date()).getUTCFullYear()
                })).save(function (err,newPoint) {
                    if(err){
                        console.log(err);
                        return null;
                    }
                    return newPoint;
                })
            }
            return result;
        });
    });
};

exports.updatePoint = function(userId,isUpvote){
    ///Find by userID
    //Check if point for that month exist,
    //If exist -> add / subtract
    //else create new schema and add/subtract
    User.findOne(
        {_id:userId},
        function (err,user) {
            if(err) {
                console.log(err);
                return false;
            }
            var point = isUpvote ? 1 : -1;
            UserPoint.findOneAndUpdate(
                {
                    userId:user._id,
                    month:(new Date()).getUTCMonth(),
                    year:(new Date()).getUTCFullYear()
                },
                {$inc:{point:point}},
                {new:true},
                function (err,userPoint) {
                    if(err) {
                        console.log(err);
                        return false;
                    }
                    if(!userPoint){
                        userPoint = new UserPoint({
                            userId:user._id,
                            month:(new Date()).getUTCMonth(),
                            year:(new Date()).getUTCFullYear(),
                            point:point
                        });
                        userPoint.save(function (err) {
                            if(err) {
                                console.log(err);
                                return false;
                            }
                            return true;
                        })
                    }
                    return true;
                }
            )
        }
    )
};
