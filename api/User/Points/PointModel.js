'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var pointSchema = new Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    created_at:{
        type:Date,
        default:Date.now
    },
    point:{
        type:Number,
        default:0
    }
});

var PointModel = mongoose.model('PointByMonth', pointSchema);

module.exports = PointModel;