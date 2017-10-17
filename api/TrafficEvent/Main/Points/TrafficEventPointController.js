'use strict';
var mongoose = require('mongoose'),
    EventPoint = mongoose.model('TrafficEventPoint');
const
    codeSuccess = 200,
    msgSuccess = "Success",
    codeServerError = 500,
    codeBadRequest = 400,
    codeNotFound = 401,

    msgServerError = "Server Internal Error",
    msgEventNotFound = "Event not found"
    ;

    exports.createEventPoint = function (res,eventId) {
    var newEventPoint = new EventPoint(eventId);
    newEventPoint.save(function (err,eventPoint) {
        if(err){
            console.log(err);
            return false;
        }
        return true;
    })
};

exports.addEventPoint = function (req,res) {
    EventPoint.findOne({
        eventId:req.params.eventId
    }, function (err,eventExist) {
        if(!eventExist){
            return result(res,codeNotFound,msgEventNotFound,null);
        }
        if(err){
            return result(res,codeServerError,msgServerError,null);
        }

        return result(res,codeSuccess,msgSuccess,)
    })
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

