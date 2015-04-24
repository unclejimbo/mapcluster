var mongoose = require('mongoose');
var settings = require('../settings');
//var db = mongoose.createConnection(settings.host, settings.db, settings.port);
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

module.exports = new Poi();
