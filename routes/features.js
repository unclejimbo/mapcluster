var Poi = require('../models/Poi');
var makeMCode = require('../utils/makeMCode');
var cons = require('../utils/constants');
var proj = require('../utils/projection');
var MAX_ZOOM = cons.MAX_ZOOM;
var bodyParser = require('body-parser');
var express = require('express');
var app = express();
app.use(bodyParser.urlencoded({extended:false}));

exports.findVisible = function(req, res) {
    var xmin = parseFloat(req.query.xmin);
    var ymin = parseFloat(req.query.ymin);
    var xmax = parseFloat(req.query.xmax);
    var ymax = parseFloat(req.query.ymax);
    var lonlatmin = new Array(2);
    var lonlatmax = new Array(2);
    proj.merc2lonlat([xmin, ymin], lonlatmin);
    proj.merc2lonlat([xmax, ymax], lonlatmax);
    var extent = [lonlatmin[0], lonlatmin[1],
                  lonlatmax[0], lonlatmax[1]];
    console.log(extent);
    Poi.findVisible(extent, function(err, pois) {
        res.send(pois);
    });
};

exports.all = function(req, res) {
    Poi.findAll(function(err, pois){
        res.send(pois);
    });
};

exports.add = function(req, res) {
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
                          new Number(f.geometry.coordinates[1])]
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
