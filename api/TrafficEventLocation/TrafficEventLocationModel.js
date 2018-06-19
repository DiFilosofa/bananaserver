'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ttl = require('mongoose-ttl');
var deepPopulate = require('mongoose-deep-populate')(mongoose);

var trafficEventLocationSchema = new Schema({
    event_id: {
        type: Schema.ObjectId,
        ref: 'TrafficEvent'
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
    }
});

trafficEventLocationSchema.plugin(deepPopulate);
var EventModel = mongoose.model('TrafficEventLocation', trafficEventLocationSchema);
module.exports = EventModel;