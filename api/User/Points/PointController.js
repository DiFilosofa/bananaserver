'use strict';
var mongoose = require('mongoose'),
    UserPoint = mongoose.model('PointByMonth'),
    User = mongoose.model('User')
;

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
                        userPoint = createUserPoint(user._id,point);
                        userPoint.save(function (err) {
                            if(err) {
                                console.log(err);
                                return false;
                            }
                            return updateUserSumPoint(user,point);
                        })
                    }
                    return updateUserSumPoint(user,point);
                }
            )
        }
    )
};

function updateUserSumPoint(user,point) {
    user.update(
        {$inc:{point_sum:point}},
        function (err) {
            if(err){
                console.log(err);
                return false;
            }
            return true;
        }
    );
}

function createUserPoint(userId,point){
    return new UserPoint({
        userId:userId._id,
        month:(new Date()).getUTCMonth(),
        year:(new Date()).getUTCFullYear(),
        point:point
    });
}