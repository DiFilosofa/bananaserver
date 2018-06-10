'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ttl = require('mongoose-ttl');
var deepPopulate = require('mongoose-deep-populate')(mongoose);

var trafficEventSchema = new Schema({
    userId: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    name: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    eventType: {
        type: Number,
        default: 0,
        min: 0,
        max: 3
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    end_latitude: {
        type: Number,
        required: true
    },
    end_longitude: {
        type: Number,
        required: true
    },
    note: {
        type: String
    },
    density: {
        type: Number,
        default: 1,
        min: 0,
        max: 2
    },
    next_density: {
        type: Number,
        default: 1,
        min: 0,
        max: 2
    },
    validity: {
        type: Number,
        default: 0
    },
    motorbike_speed: {
        type: Number,
        default: 1,
        min: 0,
        max: 3
    },
    car_speed: {
        type: Number,
        default: 1,
        min: 0,
        max: 3
    },
    has_rain: {
        type: Boolean,
        default: false
    },
    has_accident: {
        type: Boolean,
        default: false
    },
    should_travel: {
        type: Boolean,
        default: false
    },
    has_flood: {
        type: Boolean,
        default: false
    },
    district: {
        type: Number,
        min: 0,
        max: 24,
        default: 0
    },
    Point: {
        type: Schema.ObjectId,
        ref: 'TrafficEventPoint'
    },
    isUpvoted: {
        type: Boolean
    },
    votedScore:{
        type:Number,
        default: null
    },
    // isDownvoted: {
    //     type: Boolean
    // },
    mediaDatas: [{
        type: String
    }]
});
// trafficEventSchema.plugin(ttl, {ttl: 60000});
trafficEventSchema.plugin(deepPopulate);
var EventModel = mongoose.model('TrafficEvent', trafficEventSchema);
module.exports = EventModel;