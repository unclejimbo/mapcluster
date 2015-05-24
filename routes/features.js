var Poi = require('../models/Poi');
var makeMCode = require('../utils/makeMCode');
var cons = require('../utils/constants');
var proj = require('../utils/projection');
var mapcluster = require('../utils/mapcluster');
var fillspace = require('../utils/fillspace');
var CODE_LEN = cons.MAX_ZOOM + 4;
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
    Poi.findVisible(extent, function(err, pois) {
        res.send(pois);
    });
};

exports.big = function(req, res) {
    var level = parseInt(req.query.level),
        imgSize = parseInt(req.query.imgSize),
        dScore = parseInt(req.query.dScore),
        xmin = parseFloat(req.query.xmin),
        ymin = parseFloat(req.query.ymin),
        xmax = parseFloat(req.query.xmax),
        ymax = parseFloat(req.query.ymax),
        lonlatmin = new Array(2),
        lonlatmax = new Array(2);
    proj.merc2lonlat([xmin, ymin], lonlatmin);
    proj.merc2lonlat([xmax, ymax], lonlatmax);
    var extent = [lonlatmin[0], lonlatmin[1],
                  lonlatmax[0], lonlatmax[1]];
    var d = new Date(); 
    var start = d.getTime();
    Poi.findVisible(extent, function(err, pois) {
        pois.forEach(function(p) {
            p.properties.isBig = false;
        });
        d = new Date(); var end = d.getTime(); console.log('query' + (end-start));
        console.log('in bound' + pois.length);
        for (var i = 0; i < pois.length; ++i) {
            var p = pois[i];
            var lonlat = p.geometry.coordinates;
            var merc = new Array(2);
            proj.lonlat2merc(lonlat, merc);
            p.geometry.coordinates = merc;
        }
        d = new Date();
        start = d.getTime();
        var bigJSONs = mapcluster(pois, [xmin, ymin, xmax, ymax], level, imgSize, dScore);
        d = new Date();
        end = d.getTime();
        console.log('cluster:' + (end-start));
        var result = {
            //origin: pois,
            big: bigJSONs,
            count: pois.length
        };
        res.send(result);
    });
};

exports.bigFill = function(req, res) {
    var level = parseInt(req.query.level),
        imgSize = parseInt(req.query.imgSize),
        dScore = parseInt(req.query.dScore),
        resolution = parseFloat(req.query.resolution),
        xmin = parseFloat(req.query.xmin),
        ymin = parseFloat(req.query.ymin),
        xmax = parseFloat(req.query.xmax),
        ymax = parseFloat(req.query.ymax),
        lonlatmin = new Array(2),
        lonlatmax = new Array(2);
    proj.merc2lonlat([xmin, ymin], lonlatmin);
    proj.merc2lonlat([xmax, ymax], lonlatmax);
    var extent = [lonlatmin[0], lonlatmin[1],
                  lonlatmax[0], lonlatmax[1]];
    var d = new Date();
    var start = d.getTime();
    Poi.findVisible(extent, function(err, pois) {
        pois.forEach(function(p) {
            p.properties.isBig = false;
        });
        d = new Date(); var end = d.getTime(); console.log('query' + (end-start));
        console.log('in bound' + pois.length);
        for (var i = 0; i < pois.length; ++i) {
            var p = pois[i];
            var lonlat = p.geometry.coordinates;
            var merc = new Array(2);
            proj.lonlat2merc(lonlat, merc);
            p.geometry.coordinates = merc;
        }
        d = new Date();
        start = d.getTime();
        var bigJSONs = mapcluster(pois, [xmin, ymin, xmax, ymax], level, imgSize, dScore);
        d = new Date();
        end = d.getTime();
        console.log('cluster:' + (end-start));
        console.log('bigCount' + bigJSONs.length);
        d = new Date();
        start = d.getTime();
        var fillJSONs = fillspace.fill(pois, [xmin, ymin, xmax, ymax], level, imgSize*resolution);
        d = new Date();
        end = d.getTime();
        console.log('fill:' + (end-start));
        console.log('fillCount' + fillJSONs.length);
        var result = {
            //origin: pois,
            big: bigJSONs,
            fill: fillJSONs,
            count: pois.length
        };
        res.send(result);
    });
};

exports.small = function(req, res) {
    var level = parseInt(req.query.level),
        imgSize = parseInt(req.query.imgSize),
        dScore = parseInt(req.query.dScore),
        xmin = parseFloat(req.query.xmin),
        ymin = parseFloat(req.query.ymin),
        xmax = parseFloat(req.query.xmax),
        ymax = parseFloat(req.query.ymax),
        lonlatmin = new Array(2),
        lonlatmax = new Array(2);
    proj.merc2lonlat([xmin, ymin], lonlatmin);
    proj.merc2lonlat([xmax, ymax], lonlatmax);
    var extent = [lonlatmin[0], lonlatmin[1],
                  lonlatmax[0], lonlatmax[1]];
    var d = new Date(); 
    var start = d.getTime();
    Poi.findVisible(extent, function(err, pois) {
        pois.forEach(function(p) {
            p.properties.isBig = false;
        });
        d = new Date(); 
        var end = d.getTime(); 
        console.log('query' + (end-start));
        console.log('in bound' + pois.length);
        for (var i = 0; i < pois.length; ++i) {
            var p = pois[i];
            var lonlat = p.geometry.coordinates;
            var merc = new Array(2);
            proj.lonlat2merc(lonlat, merc);
            p.geometry.coordinates = merc;
        }
        d = new Date();
        start = d.getTime();
        var smallJSONs = mapcluster(pois, [xmin, ymin, xmax, ymax], level + 2, imgSize, dScore);
        d = new Date();
        end = d.getTime();
        console.log('small cluster:' + (end-start));
        d = new Date();
        start = d.getTime();
        var bigJSONs = mapcluster(smallJSONs, [xmin, ymin, xmax, ymax], level, imgSize, dScore);
        d = new Date();
        end = d.getTime();
        console.log('small cluster:' + (end-start));
        var result = {
            //origin: pois,
            big: bigJSONs,
            small: smallJSONs,
            count: pois.length
        };
        res.send(result);
    });
};

exports.smallFill = function(req, res) {
    var level = parseInt(req.query.level),
        imgSize = parseInt(req.query.imgSize),
        dScore = parseInt(req.query.dScore),
        resolution = parseFloat(req.query.resolution),
        xmin = parseFloat(req.query.xmin),
        ymin = parseFloat(req.query.ymin),
        xmax = parseFloat(req.query.xmax),
        ymax = parseFloat(req.query.ymax),
        lonlatmin = new Array(2),
        lonlatmax = new Array(2);
    proj.merc2lonlat([xmin, ymin], lonlatmin);
    proj.merc2lonlat([xmax, ymax], lonlatmax);
    var extent = [lonlatmin[0], lonlatmin[1],
                  lonlatmax[0], lonlatmax[1]];
    var d = new Date(); 
    var start = d.getTime();
    Poi.findVisible(extent, function(err, pois) {
        pois.forEach(function(p) {
            p.properties.isBig = false;
        });
        d = new Date(); 
        var end = d.getTime(); 
        console.log('query' + (end-start));
        console.log('in bound' + pois.length);
        for (var i = 0; i < pois.length; ++i) {
            var p = pois[i];
            var lonlat = p.geometry.coordinates;
            var merc = new Array(2);
            proj.lonlat2merc(lonlat, merc);
            p.geometry.coordinates = merc;
        }
        d = new Date();
        start = d.getTime();
        var smallJSONs = mapcluster(pois, [xmin, ymin, xmax, ymax], level+2, imgSize, dScore);
        d = new Date();
        end = d.getTime();
        console.log('small cluster:' + (end-start));
        console.log(smallJSONs.length);
        d = new Date();
        start = d.getTime();
        var bigJSONs = mapcluster(smallJSONs, [xmin, ymin, xmax, ymax], level, imgSize, dScore);
        d = new Date();
        end = d.getTime();
        console.log('big cluster:' + (end-start));
        d = new Date();
        start = d.getTime();
        var fillJSONs = fillspace.fill(pois, [xmin, ymin, xmax, ymax], level, imgSize*resolution);
        d = new Date();
        end = d.getTime();
        console.log('fill:' + (end-start));
        console.log(smallJSONs.length);
        var result = {
            //origin: pois,
            big: bigJSONs,
            fill: fillJSONs,
            small: smallJSONs,
            count: pois.length
        };
        res.send(result);
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
        emptyMCode[i] = new Array(CODE_LEN);
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
    makeMCode(poi, CODE_LEN);
    Poi.save(poi, function(err) {
        res.send(err);
    });
}

exports.update = function(req, res) {
    var f = req.body.feature;
    var prop = f.properties;

    var imgUrl = '';
    if (prop.hasOwnProperty('imgUrl')) {
        imgUrl = prop.imgUrl;
    }
    
    var impScore = 0;
    if (prop.hasOwnProperty('impScore'))
        impScore = prop.impScore;
    
    var mCode = new Array(9);
    for (var i = 0; i < mCode.length; ++i) {
        mCode[i] = new Array(CODE_LEN);
    }
    if (prop.hasOwnProperty('mCode'))
        mCode = prop.mCode;
    
    var dScore = new Array(CODE_LEN);
    for (var i = 0; i < dScore.length; ++i) {
        dScore[i] = 0;
    }
    if (prop.hasOwnProperty('dScore'))
        dScore = prop.dScore;
    
    var poi = {
        id: f.id,
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [parseFloat(f.geometry.coordinates[0]),
                          parseFloat(f.geometry.coordinates[1])]
        },
        properties: {
            impScore: impScore,
            imgUrl: imgUrl,
            mCode: mCode,
            dScore: dScore
        }
    };
    makeMCode(poi, CODE_LEN);
    Poi.update({id: poi.id}, poi, function(err) {
        res.send(err);
    });
}
