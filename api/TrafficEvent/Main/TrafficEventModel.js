'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var trafficEventSchema = new Schema({
    userId:{
        type: String,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    created_at:{
        type:Date,
        default: Date.now
    },
    updated_at:{
        type:Date,
        default: Date.now
    },
    eventType:{
        type:Number,
        default:0,
        min:0,
        max:3
    },
    latitude:{
        type:Number,
        required:true
    },
    longitude:{
        type:Number,
        required:true
    },
    end_latitude:{
        type:Number,
        required:true
    },
    end_longitude:{
        type:Number,
        required:true
    },
    note: {
        type: String
    },
    density:{
        type:Number,
        default:3,
        min:0,
        max:4
    },
    motorbike_speed:{
        type:Number,
        default:1,
        min:0,
        max:3
    },
    car_speed:{
        type:Number,
        default:1,
        min:0,
        max:3
    },
    has_rain:{
        type:Boolean,
        default:false
    },
    has_accident:{
        type:Boolean,
        default:false
    },
    should_travel:{
        type:Boolean,
        default:false
    },
    has_flood:{
        type:Boolean,
        default:false
    },
    district:{
        type:Number,
        min:0,
        max:24,
        default:0
    },
    Point:{
        type:Schema.ObjectId,
        ref:'TrafficEventPoint'
    }
});

var EventModel = mongoose.model('TrafficEvent',trafficEventSchema);
module.exports = EventModel;