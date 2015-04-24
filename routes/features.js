var Poi = require('../models/Poi');

exports.show = function(req, res) {
    res.render('features', {title:'MapCluster'});
};

exports.all = function(req, res) {
    Poi.findAll(function(err, pois){
        res.send(pois);
    });
};

exports.saveone = function(req, res) {
    var poi = {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [0,0] // TODO: post coord
        },
        properties: {}
    };
    Poi.save(poi, function(err) {
        res.send(err);
    });
}
