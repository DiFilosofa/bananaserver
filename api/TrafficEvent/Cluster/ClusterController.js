var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Event = mongoose.model('TrafficEvent'),
    Cluster = mongoose.model('ClusterModel'),
    Const = require('./../../../config/BananaConst'),
    code = require('./../../../Data/Code.js'),
    msg = require('./../../../Data/Message.js'),
    utils = require('./../../../Utils/MainUtils.js'),
    Turf = require('@turf/turf'),
    asyncForEach = require('async-foreach').forEach
;
const clusterDistance = 0.0085; //kilometers
const minPoints = 1;
const period =  300000; //5 mins in milliseconds 60000;
const reputationWeight = 0.8;
const scoreWeight = 0.2;

exports.getAllCluster = function (req, res) {
    var userId = req.params.userId;
    if (!userId) {
        return utils.result(res, code.badRequest, msg.noUserId, null);
    }
    Cluster.find()
        .deepPopulate('Events.Point, Events.userId, Events.Point.Voted')
        .exec(function (err, clusters) {
                if (err) {
                    console.log(err);
                    return utils.result(res, code.serverError, msg.serverError, null);
                }
                if (parseInt(userId) !== -1) {
                    clusters.forEach(function (cluster, clusterIndex, arr) {
                        var tempEventList = cluster.Events;
                        tempEventList.forEach(function (tempEvent, eventIndex, arr) {
                            var isVotedArray = tempEvent.Point.Voted.filter( voted =>
                                voted.userId == userId
                        )
                            if(isVotedArray.length == 0){
                                tempEvent.isUpvoted = false;
                                tempEvent.votedScore = null;
                            }
                            else{
                                tempEvent.isUpvoted = true;
                                tempEvent.votedScore = isVotedArray[0].score;
                            }
                            cluster.Event = tempEventList;
                        });
                    });
                    return utils.result(res, code.success, msg.success, clusters);
                }
                else {
                    return utils.result(res, code.success, msg.success, clusters);
                }
            }
        );
};

exports.cluster = function (req, res) {
    var locations = [];
    var hashMap = {};
    Event.find()
        .populate('Point')
        .exec(function (err, results) {
            if (err) {
                console.log(err);
                return utils.result(res, code.serverError, msg.serverError, null);
            }
            results.forEach(function (item, index, arr) {
                hashMap[item._id] = {event: item};
                locations.push(Turf.point([item.latitude, item.longitude], {eventId: item._id.toString()}));
            });
            updateClusters(Turf.clustersDbscan(Turf.featureCollection(locations), clusterDistance, {minPoints: minPoints}), hashMap);
        });
};

function updateClusters(clustersList, hashMap) {
    Cluster.remove({}, function (err) {
            if (err) {
                console.log(err);
                return;
            }
            asyncForEach(clustersList.features, function (item, index, arr) {
                var done = this.async();
                Cluster.findOne(
                    {_id: item.properties.cluster},
                    function (err, result) {
                        if (!result) {
                            var eventA = hashMap[item.properties.eventId].event;
                            var newCluster = new Cluster({
                                _id: item.properties.cluster,
                                level_now: eventA.density,
                                level_next: eventA.next_density,
                                created_at: eventA.created_at,
                                updated_at: eventA.updated_at
                            });
                            newCluster.Events.push(eventA);
                            newCluster.UserId.push(eventA.userId);
                            newCluster.highestValidity = eventA.validity;
                            newCluster.save(function (err, cluster) {
                                if (err) {
                                    console.log("new__ ===== " + err);
                                }
                                console.log("new__" + cluster);
                                // setInterval(function () {
                                //     endOfPeriod()
                                // }, period);
                                done();
                            });
                        }
                        else {
                            var eventB = hashMap[item.properties.eventId].event;
                            result.created_at = Math.min(eventB.created_at, result.created_at);
                            result.Events.push(eventB);
                            result.UserId.push(eventB.userId);
                            if (eventB.validity > result.highestValidity) {
                                result.level_now = eventB.density;
                                result.level_next = eventB.next_density;
                                result.highestValidity = eventB.validity;
                            }
                            result.save(function (err, cluster) {
                                if (err) {
                                    console.log("old__" + err);
                                }
                                console.log("old__" + cluster);
                                // setInterval(function () {
                                //     endOfPeriod()
                                // }, period);
                                done();
                            });
                        }
                    }
                )
            });
        }
    );

}