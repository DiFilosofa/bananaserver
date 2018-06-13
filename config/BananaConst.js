// config/database.js
module.exports = {
    'url': 'mongodb://banana_admin:mrtiken@ds139436.mlab.com:39436/bananaserver',
    'secret': 'minionAndGru'
};

exports.reputationWeight = 0.8;
exports.eventPointWeight = 0.2;
exports.clusterDistance = 0.005;
exports.clusterMinPoints = 1;
