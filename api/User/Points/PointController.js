'use strict';
var mongoose = require('mongoose'),
    PointByMonth = mongoose.model('PointByMonth');

exports.createNewPoint = function (userId,res) {
    var newPoint = new PointByMonth({
        userId:userId
    });
    newPoint.save(function (err,newSchema) {
        if(err){
            console.log(err);
            return res.code(500).send("Server Internal Error");
        }
        return newSchema;
    })
};
