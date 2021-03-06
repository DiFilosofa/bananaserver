var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Event = mongoose.model('TrafficEvent'),
    Cluster = mongoose.model('ClusterModel'),
    Const = require('./../../../config/BananaConst'),
    code = require('./../../../Data/Code.js'),
    msg = require('./../../../Data/Message.js'),
    utils = require('./../../../Utils/MainUtils.js'),
    Turf = require('@turf/turf'),
    asyncForEach = require('async-foreach').forEach,
    GeoPoint = require('geopoint')
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
            var size = clustersList.features.length;
            asyncForEach(clustersList.features, function (item, index, arr) {
                var begin_coors = [];
                var end_coors = [];

                var done = this.async();
                Cluster.findOne(
                    {_id: item.properties.cluster},
                    function (err, result) {
                        if (!result) { //if no cluster yet
                            var eventA = hashMap[item.properties.eventId].event;
                            begin_coors.push(new GeoPoint(eventA.latitude, eventA.longitude, false));
                            end_coors.push(new GeoPoint(eventA.end_latitude, eventA.end_longitude, false));
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
                                    // console.log("new__ ===== " + err);
                                }
                                // console.log("new__" + cluster);
                                // setInterval(function () {
                                //     endOfPeriod()
                                // }, period);
                                if (index == size - 1) {
                                    calculateClusterMaxDistance()
                                }
                                done();
                            });
                        }
                        else { //if already a cluster
                            var eventB = hashMap[item.properties.eventId].event;
                            begin_coors.push(new GeoPoint(eventB.latitude, eventB.longitude, false));
                            end_coors.push(new GeoPoint(eventB.end_latitude, eventB.end_longitude, false));

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
                                // console.log("old__" + cluster);
                                // setInterval(function () {
                                //     endOfPeriod()
                                // }, period);
                                if (index == size - 1) {
                                    calculateClusterMaxDistance()
                                }
                                done();
                            });
                        }
                    }
                );
            });
        }
    );
}

function calculateClusterMaxDistance() {
    Cluster.find()
        .deepPopulate('Events.Point, Events.userId, Events.Point.Voted')
        .exec(function (err, clusters) {
            if (err) {
                console.log(err);
                return utils.result(res, code.serverError, msg.serverError, null);
            }
            asyncForEach(clusters, function (cluster, index, arr) {
                var done = this.async();
                var eventArray = cluster.Events;
                var maxDistance = 0;
                var beginLat = 0.0;
                var beginLng = 0.0;
                var endLat = 0.0;
                var endLng = 0.0;
                if (eventArray.length == 1){
                    console.log("cluster_" + index);
                    cluster.begin_lat = eventArray[0].latitude;
                    cluster.begin_lng = eventArray[0].longitude;
                    cluster.end_lat = eventArray[0].end_latitude;
                    cluster.end_lng = eventArray[0].end_longitude;
                    cluster.save(function (err, result) {
                        if(err) {
                            console.log(err)
                        }
                        console.log(result);
                        done();
                    })
                } else {
                    console.log("cluster_" + index);
                    eventArray.forEach(function (event, eventIndex, eventArr) {
                        var beginTempLat = event.latitude;
                        var beginTempLng = event.longitude;

                        eventArray.forEach(function (endEvent, endIndex, endArr) {

                            var endTempLat = endEvent.end_latitude;
                            var endTempLng = endEvent.end_longitude;

                            var distance = calculateDistance(beginTempLat, beginTempLng, endTempLat, endTempLng);

                            if (distance > maxDistance){
                                maxDistance = distance;
                                beginLat = beginTempLat;
                                beginLng = beginTempLng;
                                endLat = endTempLat;
                                endLng = endTempLng;
                            }
                            if (endIndex == endArr.length - 1 && eventIndex == eventArr.length - 1) {
                                cluster.begin_lat = beginLat;
                                cluster.begin_lng = beginLng;
                                cluster.end_lat = endLat;
                                cluster.end_lng = endLng;
                                cluster.save(function (err, result) {
                                    if(err) {
                                        console.log(err)
                                    }
                                    console.log("success bot");
                                    done();
                                })
                            }
                        });
                    })
                }
            })
        });
}

function calculateDistance(startLat, startLng, endLat, endLng) {
    var R = 6371; // Radius of the earth in meters
    var dLat = deg2rad(endLat - startLat);
    var dLon = deg2rad(endLng - startLng);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(startLat)) * Math.cos(deg2rad(endLat)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in km;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}
