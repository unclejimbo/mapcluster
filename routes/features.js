var Poi = require('../models/Poi');
var makeMCode = require('../utils/makeMCode');
var cons = require('../utils/constants');
var MAX_ZOOM = cons.MAX_ZOOM;
var bodyParser = require('body-parser');
var express = require('express');
var app = express();
app.use(bodyParser.urlencoded({extended:false}));

exports.show = function(req, res) {
    res.render('features', {title:'MapCluster'});
};

exports.all = function(req, res) {
    Poi.findAll(function(err, pois){
        res.send(pois);
    });
};

exports.saveone = function(req, res) {
    var emptyMCode = new Array(9);
    for (var i = 0; i < emptyMCode.length; ++i) {
        emptyMCode[i] = new Array(MAX_ZOOM);
    }
    var cnt = req.body.cnt;  // features count
    var poi = {
        id: 'feature' + cnt,
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [new Number(req.body.x),
                          new Number(req.body.y)]
        },
        properties: {
            impScore: req.body.impScore,
            imgUrl: req.body.imgUrl,
            mCode: emptyMCode,
            dScore: 0
        }
    };
    makeMCode(poi, MAX_ZOOM);
    Poi.save(poi, function(err) {
        res.send(err);
    });
}

exports.update = function(req, res) {
    var f = req.body.feature;
    if (f.hasOwnProperty('mCode'))
        return;
    var emptyMCode = new Array(9);
    for (var i = 0; i < emptyMCode.length; ++i) {
        emptyMCode[i] = new Array(MAX_ZOOM);
    }
    var poi = {
        id: f.id,
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [new Number(f.geometry.coordinates[0]),
                          new Number(f.geometry.coordinates[0])]
        },
        properties: {
            impScore: f.impScore,
            imgUrl: f.imgUrl,
            mCode: emptyMCode,
            dScore: 0
        }
    };
    makeMCode(poi, MAX_ZOOM);
    Poi.update({id: poi.id}, poi, function(err) {
        res.send(err);
    });
}
