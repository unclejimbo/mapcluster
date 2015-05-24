/// <reference path="../typings/mongoose/mongoose.d.ts"/>
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mapcluster');
var db = mongoose.connection;
db.on('open', function(callback){
    console.log('db connected!!!');
});

// GeoJSON feature
var PoiSchema = new mongoose.Schema({
    'type': {type: String, default: 'Feature'},
    geometry: {
        'type': {type: String, default: 'Point'},
        coordinates: [{type: "Number"}]
    },
    properties: {type: 'Object'}
}, {
    collection: 'poi'
});
PoiSchema.index({geometry:'2dsphere'});
var PoiModel = mongoose.model('Poi', PoiSchema);
var Poi = function(){};

// store poi to db
Poi.prototype.save = function(poi, callback) {
    var PoiEntity = new PoiModel(poi);
    PoiEntity.save(function(err) {
        callback(err);
    });
};

// retrieve all pois
Poi.prototype.findAll = function(callback) {
    PoiModel.find(function(err, pois){
        callback(err, pois);
    });
};

// retrieve pois within viewport
Poi.prototype.findVisible = function(extent, callback) {
    var lowerLeft = [extent[0], extent[1]];
    var upperRight = [extent[2], extent[3]];
    var query = PoiModel.find();
    query.where('geometry').within().box(lowerLeft, upperRight).maxScan(3000);
    query.exec(function(err, pois) {
        callback(err, pois);
    });
};

// update poi
Poi.prototype.update = function(query, poi, callback) {
    PoiModel.update(query, poi, function(err) {
        callback(err);
    });
};

module.exports = new Poi();
