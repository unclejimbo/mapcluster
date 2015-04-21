var mongoose = require('mongoose');
var settings = require('../settings');
var db = mongoose.createConnection(settings.host, settings.db, settings.port);
db.on('error', console.error(error));
db.once('open', function (callback) {
    var PoiSchema = new mongoose.Schema({
        name: String,
        loc: {
            type: [Number],
            index: '2dsphere'
        }
    },{
        collection: 'poi'
    });
    var PoiModel = mongoose.model('Poi', PoiSchema);
    function Poi(poi) {
        this.name = poi.name;
        this.loc = poi.loc;
    }
    
    // store poi to db
    Poi.prototype.save = function(callback) {
        var poi = {
            name: this.name,
            loc: this.loc
        };
        var thePoi = new PoiModel(poi);
        thePoi.save(function(err, user) {
            if (err)
                return callback(err);
            callback(null, poi);
        });
    };

    Poi.findAll = function(callback) {
        PoiModel.find(function(err, pois) {
            if (err)
                return callback(err);
            callback(null, pois);
        });
    }
    module.exports = Poi;
});
