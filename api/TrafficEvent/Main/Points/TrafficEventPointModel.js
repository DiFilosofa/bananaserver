'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var trafficPointsSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    event_id: {
        type: Schema.ObjectId,
        ref: 'TrafficEvent'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    points: {
        type: Number,
        default: 0.01
    },
    scoreSum: {
        type: Number,
        default: 0
    },
    Voted:[{
        type:Schema.ObjectId,
        ref: 'EventFeedback'
    }]
});
var EventPoint = mongoose.model('TrafficEventPoint', trafficPointsSchema);
module.exports = EventPoint;