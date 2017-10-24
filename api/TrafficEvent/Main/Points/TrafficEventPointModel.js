'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var trafficPointsSchema = new Schema({
    event_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'TrafficEvent'
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    upvotes:{
        type:Number,
        default:0
    },
    downvotes:{
        type:Number,
        default:0
    }
});
var EventPoint = mongoose.model('TrafficEventPoint', trafficPointsSchema);
module.exports = EventPoint;