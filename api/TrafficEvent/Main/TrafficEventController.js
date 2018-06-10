"use strict";
var mongoose = require('mongoose'),
    code = require('../../../Data/Code.js'),
    msg = require('../../../Data/Message.js'),
    utils = require('../../../Utils/MainUtils.js'),
    aws_s3 = require('../../../Data/AWSConstants'),
    UserPointController = require('../../User/Points/PointController.js'),
    Event = mongoose.model('TrafficEvent'),
    User = mongoose.model('User'),
    EventPoint = mongoose.model('TrafficEventPoint'),
    UserPoint = mongoose.model('PointByMonth'),
    Feedback = mongoose.model('EventFeedback'),
    // ttl = require('mongoose-ttl'),
    util = require("util"),
    formidable = require('formidable'),
    async = require('async'),
    fs = require('fs'),
    path = require('path')
;

var imageData, imageName;

const createItemObject = function (callback) {
    const params = {
        Bucket: aws_s3.bucketName,
        Key: imageName,
        ACL: 'public-read',
        Body: imageData
    };
    aws_s3.s3.putObject(params, function (err, data) {
        if (err) {
            console.log("Error uploading image: ", err);
            callback(err, null)
        } else {
            console.log("Successfully uploaded image on S3", data);
            callback(null, data)
        }
    })
};

exports.createEvent = function (req, res) {
    var body = req.body;
    if (!body.userId) {
        return utils.result(res, code.badRequest, msg.userNotFound, null);
    }
    if (!body.name) {
        return utils.result(res, code.badRequest, msg.nameNotFound, null)
    }
    if (!body.latitude) {
        return utils.result(res, code.badRequest, msg.latitudeNotFound, null);
    }
    if (!body.longitude) {
        return utils.result(res, code.badRequest, msg.longitudeNotFound, null);
    }
    if (!body.end_latitude) {
        return utils.result(res, code.badRequest, msg.endLatitudeNotFound, null);
    }
    if (!body.end_longitude) {
        return utils.result(res, code.badRequest, msg.endLongitudeNotFound, null);
    }
    if (body.eventType && (body.eventType > 3 || body.eventType < 0)) {
        return utils.result(res, code.badRequest, msg.invalidEventType, null);
    }
    if (!body.density) {
        return utils.result(res, code.badRequest, msg.densityNotFound, null);
    }
    if (!body.next_density) {
        return utils.result(res, code.badRequest, msg.nextDensityNotFound, null);
    }
    if (body.density && (body.density < 0 || body.density > 2)) {
        return utils.result(res, code.badRequest, msg.invalidDensity, null);
    }
    if (body.next_density && (body.next_density < 0 || body.next_density > 2)) {
        return utils.result(res, code.badRequest, msg.invalidNextDensity, null);
    }
    if (body.speed && (body.speed < 0 || body.speed > 3)) {
        return utils.result(res, code.badRequest, msg.invalidSpeed, null);
    }
    // var expiredTime = 0;
    // switch (body.density) {
    //     case 0:
    //         expiredTime = '5m'; //minute
    //         break;
    //     case 1:
    //         expiredTime = '15m'; //minute
    //         break;
    //     case 2:
    //         expiredTime = '25m'; //minue
    //         break;
    //     case 3:
    //         expiredTime = '35m';
    //         break;
    //     case 4:
    //         expiredTime = '45m';
    //         break;
    // }

    var newEvent = Event(body);
    // newEvent.ttl = expiredTime;

    User.findOne({
        _id: body.userId
    }, function (err, userExist) {
        if (!userExist) {
            return utils.result(res, code.notFound, msg.userNotFound, null);
        }
        if (err) {
            console.log(err);
            return utils.result(res, code.serverError, msg.serverError, err.message);
        }
        newEvent.validity = userExist.reputation * 0.01;
        newEvent.save(function (err, event) {
            if (err) {
                console.log(err);
                return utils.result(res, code.serverError, msg.serverError, err.message);
            }
            var eventPoint = new EventPoint({
                event_id: event._id,
                userId: event.userId
            });
            eventPoint.save(function (err) {
                if (err) {
                    console.log(err);
                    return utils.result(res, code.serverError, msg.serverError, err.message);
                }
                Event.findOneAndUpdate(
                    {_id: event._id},
                    {Point: eventPoint._id},
                    {new: true},
                    function (err) {
                        if (err) {
                            console.log(err);
                            return utils.result(res, code.serverError, msg.serverError, err.message);
                        }
                        return utils.result(res, code.success, msg.success, event);
                    }
                );
            });
        });
    });
};

exports.updateEventPhotos = function (req, res) {
    var eventId = req.params.eventId;
    if (!eventId) {
        return utils.result(res, code.badRequest, msg.noEventId, null);
    }
    Event.findOne(
        {
            _id: eventId
        }, function (err, event) {
            if (err) {
                console.log(err);
                return utils.result(res, code.serverError, msg.serverError, err.message);
            }
            if (!event) {
                return utils.result(res, code.notFound, msg.eventNotFound, null);
            }
            var form = new formidable.IncomingForm();

            // form.maxFieldsSize = 2 * 1024 * 1024; //set max size

            var image;

            form.parse(req, function (err, fields, files) {

            });

            form.on('file', function (name, value) {
                console.log("onFile : " + util.inspect({name: name, value: value}))
            });

            form.on('error', function (err) {
                console.error("onError : " + err);
                return utils.result(res, code.serverError, msg.serverError, err.message);
            });

            form.on('end', function (fields, files) {
                image = this.openedFiles[0];
                //if no file or not supported type
                if (!path.extname(image.name) || aws_s3.supportedFileExtensions.indexOf(path.extname(image.name)) === -1) {
                    return utils.result(res, code.badRequest, msg.fileNotSupported, null);
                }
                /* Temporary location of our uploaded file */
                var tmp_path = image.path;
                /* The file name of the uploaded file */
                imageName = eventId + "_event_img_" + event.mediaDatas.length + path.extname(image.name);

                fs.readFile(tmp_path, function (err, data) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    imageData = data;
                    async.series([
                        createItemObject
                    ], function (err, result) {
                        if (err) {
                            console.log(err);
                            return utils.result(res, code.serverError, msg.serverError, err.message);
                        }
                    })
                });
                var url = aws_s3.dataUrlInitial + imageName;
                // var expiredTime = 0;
                // switch (event.density) {
                //     case 0:
                //         expiredTime = '5m'; //minute
                //         break;
                //     case 1:
                //         expiredTime = '15m'; //minute
                //         break;
                //     case 2:
                //         expiredTime = '25m'; //minue
                //         break;
                //     case 3:
                //         expiredTime = '35m';
                //         break;
                //     case 4:
                //         expiredTime = '45m';
                //         break;
                // }
                //
                // event.ttl = expiredTime;
                ///update media datas
                event.mediaDatas.push(url);
                event.save();

                return utils.result(res, code.success, msg.success, event);
            });
        });
};

exports.getAllEvents = function (req, res) {
    var userId = req.params.userId;
    Event.find()
        .deepPopulate('Point, Point.Voted, userId, userId.UserPoints')
        .exec(function (err, results) {
            if (err) {
                console.log('err');
                return utils.result(res, code.serverError, msg.serverError, err.message);
            }
            var numberOfEvents = results.length;
            var tempList = results.slice();

            if (parseInt(userId) !== -1) {
                for (var index = 0; index < numberOfEvents; index++) {
                    var tempEvent = results[index];

                    var isVotedArray = tempEvent.Point.Voted.filter(voted =>
                        voted.userId == userId
                    );
                    if (isVotedArray.length == 0) {
                        tempEvent.isUpvoted = false;
                        tempEvent.votedScore = null;
                    }
                    else {
                        tempEvent.isUpvoted = true;
                        tempEvent.votedScore = isVotedArray[0].score;
                    }
                    tempList[index] = tempEvent;
                    // tempEvent.isUpvoted = (tempEventList[eventIndex].Point.Voted.indexOf(userId) > -1);
                    // var temp = results[index].toJSON();
                    // temp.isUpvoted = (results[index].Point.Voted.indexOf(userId) > -1);
                    // tempList[index] = temp;
                }
            }
            return utils.result(res, code.success, msg.success, tempList);
        })
};

exports.getEventById = function (req, res) {
    Event.findOne({
        _id: req.params.eventId
    })
        .populate('Point')
        .exec(function (err, result) {
            if (!result) {
                return utils.result(res, code.badRequest, msg.eventNotFound, null);
            }
            if (err) {
                console.log(err);
                return utils.result(res, code.serverError, msg.serverError, err.message);
            }
            return utils.result(res, code.success, msg.success, result);
        })
};

exports.updateEventById = function (req, res) {
    var body = req.body;
    if (req.body.userId) {
        return utils.result(res, code.badRequest, msg.noUpdateUserId, null);
    }
    if (body.eventType && (body.eventType > 4 || body.eventType < 0)) {
        return utils.result(res, code.badRequest, msg.invalidEventType, null);
    }
    if (body.density && (body.density < 0 || body.density > 4)) {
        return utils.result(res, code.badRequest, msg.invalidDensity, null);
    }
    if (body.speed && (body.speed < 0 || body.speed > 3)) {
        return utils.result(res, code.badRequest, msg.invalidSpeed, null);
    }

    Event.findByIdAndUpdate(req.params.eventId, body, {new: true}, function (err, event) {
        if (!event)
            return utils.result(res, code.notFound, msg.eventNotFound, null);
        if (err)
            return utils.result(res, code.serverError, msg.serverError, err.message);
        return utils.result(res, code.success, msg.success, event);
    });
};

exports.deleteEvent = function (req, res) {
    Event.findOne({
        _id: req.params.eventId
    }, function (err, eventExist) {
        if (err) {
            return utils.result(res, code.serverError, msg.serverError, err.message);
        }
        if (eventExist) {
            Event.remove({
                _id: req.params.eventId
            }, function (err, deleted) {
                if (!deleted) {
                    return utils.result(res, code.notFound, msg.eventNotFound, null);
                }
                if (err) {
                    return utils.result(res, code.serverError, msg.serverError, err.message);
                }
                if (deleted) {
                    return utils.result(res, code.success, msg.success, null);
                }
            });
        }
        else {
            return utils.result(res, code.notFound, msg.eventNotFound, null);
        }
    });
};

exports.vote = function (req, res) {
    var body = req.body;
    if (!body.userId) {
        return utils.result(res, code.badRequest, msg.noUserId, null);
    }
    if (!body.score) {
        return utils.result(res, code.badRequest, msg.noScore, null);
    }

    Event.findOne(
        {
            _id: req.params.eventId
        }
    ).populate('Point').exec(
        function (err, event) {
            if (err) {
                console.log(err);
                return utils.result(res, code.serverError, msg.serverError, null);
            }
            if (!event) {
                return utils.result(res, code.notFound, msg.eventNotFound, null);
            }
            if (event.userId._id == body.userId) {
                return utils.result(res, code.badRequest, msg.sameUserVote, null);
            }
            User.findOne(
                {
                    _id: body.userId
                }, function (err, user) {
                    if (!user) {
                        console.log(err);
                        return utils.result(res, code.badRequest, msg.userNotFound, null);
                    }
                    if (err) {
                        console.log(err);
                        return utils.result(res, code.serverError, msg.serverError, null);
                    }
                    EventPoint.findOne({_id: event.Point})
                        .populate('Voted')
                        .exec(function (err, eventPoint) {
                            var isVotedArray = eventPoint.Voted.filter(voted =>
                                voted.userId == body.userId
                        );                            ;
                            if (isVotedArray.length == 0) {
                                var newFeedback = new Feedback({
                                    userId: body.userId,
                                    score: body.score
                                });
                                newFeedback.save(function (err, feedback) {
                                    if (err) {
                                        console.log(err);
                                        return utils.result(res, code.serverError, msg.serverError, null);
                                    }
                                    eventPoint.Voted.push(feedback);
                                    eventPoint.scoreSum = eventPoint.scoreSum + body.score * user.reputation; //update score sum
                                    var numberOfVotes = eventPoint.Voted.length;
                                    if (numberOfVotes < 2) {
                                        eventPoint.save().then(
                                            event.save().then(
                                                Event.findOne({_id: req.params.eventId})
                                                    .deepPopulate('Point userId')
                                                    .exec(function (err, result) {
                                                        if (err) {
                                                            console.log(err);
                                                            return utils.result(res, code.serverError, msg.serverError, null);
                                                        }
                                                        return utils.result(res, code.success, msg.success, result);
                                                    })
                                            )
                                        );
                                    } else {
                                        eventPoint.points = eventPoint.scoreSum / numberOfVotes;
                                        event.validity = user.reputation * eventPoint.points;
                                        eventPoint.save().then(
                                            event.save().then(
                                                Event.findOne({_id: req.params.eventId})
                                                    .deepPopulate('Point userId')
                                                    .exec(function (err, result) {
                                                        if (err) {
                                                            console.log(err);
                                                            return utils.result(res, code.serverError, msg.serverError, null);
                                                        }
                                                        return utils.result(res, code.success, msg.success, result);
                                                    })
                                            )
                                        );
                                    }
                                });
                            }
                            else {
                                return utils.result(res, code.badRequest, msg.alreadyVoted, null);
                            }
                        });
                }
            );
        }
    );
};

///This function will fire after each period of time
function updateUserValidity(res) {
    Event.find()
        .deepPopulate('Point userId')
        .exec(function (err, results) {
            if (err) {
                console.log('err');
                return utils.result(res, code.serverError, msg.serverError, null);
            }
            results.forEach(function (element) {
                User.findOne({
                    _id: element.userId
                }, function (err, user) {
                    if (err) {
                        console.log('err');
                        return utils.result(res, code.serverError, msg.serverError, null);
                    }
                    return UserPointController.updateUserReputation(element.userId, element.Point.points)
                })
            });
        })
}