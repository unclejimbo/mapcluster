/* global mapcluster */
/* global Delaunay */
/// <reference path="../../typings/angularjs/angular.d.ts""/>
/// <reference path="../../typings/ol3/ol.d.ts""/>
var MERC = 40075016.68;
var HALF_MERC = 20037508.34;
var PI = 245850922 / 78256779;
var MAX_ZOOM = 20;
var MAX_RESOLUTION = 156543.033906;

function createStyle(uri, size) {
    var img = new ol.style.Icon({
        src: '/images/' + uri,
        size: [128,128],
        offset: [0,0],
        offsetOrigin: 'top-left',
        scale: size/128,
        snapToPixel: false
    });
    var style = new ol.style.Style({
        image: img
    });
    return style;
}

function getLevel(zoom, size) {
    var level = zoom;
    var resolution = MAX_RESOLUTION / Math.pow(2, level);
    var imgLen = size * resolution;
    do {
        var gridLen = MERC / Math.pow(2, level);
        var outer = gridLen * 2 / 3;
        var inner = gridLen * 1 / 3;   
        if (imgLen > outer)
            --level;
        if (imgLen < inner)
            ++level;
    } while (imgLen > outer || imgLen < inner)
    return level;
}

function drawGrid(level, extent, size) {
    size = size || 40;
    var gridLen = MERC / Math.pow(2, level);
    var xmin = extent[0] - gridLen;
    var xmax = extent[2] + gridLen;
    var ymin = extent[1] - gridLen;
    var ymax = extent[3] + gridLen;
    var lines = new Array();
    for (var i = xmin; i <=xmax; i += gridLen) {
        var line = new ol.geom.LineString([[i,ymin], [i,ymax]]);
        lines.push(new ol.Feature(line));
    }
    for (var i = ymin; i <=ymax; i += gridLen) {
        var line = new ol.geom.LineString([[xmin,i], [xmax,i]]);
        lines.push(new ol.Feature(line));
    }
    return lines;
}

var map = new ol.Map({
    view: new ol.View({
        center: [0, 0],
        zoom: 3,
        maxZoom: 20,
        minZoom: 2
    }),
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM(),
            title: 'Base OSM'
        })
    ],
    target: 'map'
});
map.addControl(new ol.control.ZoomSlider);
map.addControl(new ol.control.LayerSwitcher);

var gridLayer = new ol.layer.Vector({
    title: 'Grid Layer'
});
map.addLayer(gridLayer);
var heatLayer = new ol.layer.Heatmap({
    title: 'Heatmap Layer',
    radius: 50,
    blur: 80
});
map.addLayer(heatLayer);
var fill = new ol.style.Fill({
    color: [255,255,255,0.4]
});
var stroke = new ol.style.Stroke({
    color: [0,150,255,1],
    width: 1.0
});
var originLayer = new ol.layer.Vector({
    title: 'Origin Layer',
    style: new ol.style.Style({
        fill: fill,
        stroke: stroke,
        image: new ol.style.Circle({
            radius: 3,
            fill: fill,
            stroke: stroke
        })
    })
});
map.addLayer(originLayer);
var smallLayer = new ol.layer.Vector({
    title: 'Small Layer'
});
map.addLayer(smallLayer);
var bigLayer = new ol.layer.Vector({
    title: 'Big Layer'
});
map.addLayer(bigLayer);
/*var triLayer = new ol.layer.Vector({
    title: 'Tri Layer'
});
map.addLayer(triLayer);*/
var fillLayer = new ol.layer.Vector({
    title: 'Fill Layer',
    style: new ol.style.Style({
        fill: fill,
        stroke: stroke,
        image: new ol.style.Circle({
            radius: 10,
            fill: fill,
            stroke: stroke
        })
    })
});
map.addLayer(fillLayer);

var app = angular.module('myApp', []);
app.controller('mapCtrl', function($scope, $http) {
    function redraw() {   
        var imgSize = $scope.imgSize || 40,
            dScore = $scope.dScore || 9,
            mapExtent = map.getView().calculateExtent(map.getSize()),
            zoom = map.getView().getZoom(),
            resolution = MAX_RESOLUTION/Math.pow(2, zoom),
            level = getLevel(zoom, imgSize),
            gridLen = MERC / Math.pow(2, level),
            drawSmall = true;  // toggle draw small layer
            
        if (!drawSmall) {
        var promise = $http({url: 'http://localhost:3000/features/big-fill',
                             method: 'GET',
                             params: {xmin: mapExtent[0] - gridLen,
                                      ymin: mapExtent[1] - gridLen,
                                      xmax: mapExtent[2] + gridLen,
                                      ymax: mapExtent[3] + gridLen,
                                      resolution: resolution,
                                      level: level,
                                      imgSize: imgSize,
                                      dScore: dScore}});
        promise.success(function(result) {
            if (result.hasOwnProperty('origin')) {
                var originJSONs = result.origin;
                var originFeatures = new Array();
                originJSONs.forEach(function(oj) {
                    var originFeature = new ol.format.GeoJSON().readFeature(oj);
                    originFeatures.push(originFeature);
                });
                var originSource = new ol.source.Vector({
                    projection: 'EPSG:900913'
                });
                originSource.addFeatures(originFeatures);
                originLayer.setSource(originSource);
            }
               
            var bigJSONs = result.big;              
            var bigFeatures = new Array();    
            bigJSONs.forEach(function(bj) {
                var bigFeature = new ol.format.GeoJSON().readFeature(bj);
                bigFeature.setStyle(createStyle('whu.jpeg', imgSize));
                bigFeatures.push(bigFeature);
            });
            var bigSource = new ol.source.Vector({
                projection: 'EPSG:900913'
            });
            bigSource.addFeatures(bigFeatures);
            bigLayer.setSource(bigSource);
            
            var fillJSONs = result.fill;
            var fillFeatures = new Array();
            fillJSONs.forEach(function(fj) {
                var x = fj.geometry.coordinates[0], 
                    y = fj.geometry.coordinates[1],
                    len = imgSize * resolution / 2;
                var lr = new ol.geom.LinearRing([[x-len,y-len],
                                                 [x-len,y+len],
                                                 [x+len,y+len],
                                                 [x+len,y-len]]);
                var square = new ol.geom.Polygon([[]]);
                square.appendLinearRing(lr);
                fillFeatures.push(new ol.Feature(square));
            });
            var fillSource = new ol.source.Vector({
                projection: 'EPSG:900913'
            });
            fillSource.addFeatures(fillFeatures);
            fillLayer.setSource(fillSource);
              
            $scope.bigCount = bigFeatures.length;
            $scope.fillCount = fillFeatures.length;
            $scope.imgCount = result.count;
            var n = new Number($scope.bigCount/$scope.imgCount);
            $scope.bigPercent = n.toFixed(3);
            n = new Number(($scope.bigCount+$scope.fillCount)/$scope.imgCount);
            $scope.bigFillPercent = n.toFixed(3);
            var viewArea = document.getElementById('map').offsetHeight *
                           document.getElementById('map').offsetWidth;
            var c = new Number($scope.bigCount*imgSize*imgSize/viewArea);
            $scope.bigCov = c.toFixed(3);
            c = new Number(($scope.bigCount+$scope.fillCount)*imgSize*imgSize/viewArea);
            $scope.bigFillCov = c.toFixed(3);
            
            /*var tris = Delaunay.triangulate(JSONs, 
                                            resolution*imgSize*1.6,
                                            level);
            var triSource = new ol.source.Vector({
                projection: 'EPSG:900913'
            });
            var coords = new Array();
            JSONs.forEach(function (j) {
                coords.push(j.geometry.coordinates);
            });
            for (var i = 0; i < tris.length; ) {
                var lr = new ol.geom.LinearRing([coords[tris[i++]], 
                                                 coords[tris[i++]], 
                                                 coords[tris[i++]]]);
                var tri = new ol.geom.Polygon([[]]);
                tri.appendLinearRing(lr);
                var triFeature = new ol.Feature(tri);
                triSource.addFeature(triFeature);
            }
            triLayer.setSource(triSource);*/
        });
        } else {
        var promise2 = $http({url: 'http://localhost:3000/features/small-fill',
                             method: 'GET',
                             params: {xmin: mapExtent[0] - gridLen,
                                      ymin: mapExtent[1] - gridLen,
                                      xmax: mapExtent[2] + gridLen,
                                      ymax: mapExtent[3] + gridLen,
                                      resolution: resolution,
                                      level: level,
                                      imgSize: imgSize,
                                      dScore: dScore}});
        promise2.success(function(result) {
            if (result.hasOwnProperty('origin')) {
                var originJSONs = result.origin;
                var originFeatures = new Array();
                originJSONs.forEach(function(oj) {
                    var originFeature = new ol.format.GeoJSON().readFeature(oj);
                    originFeatures.push(originFeature);
                });
                var originSource = new ol.source.Vector({
                    projection: 'EPSG:900913'
                });
                originSource.addFeatures(originFeatures);
                originLayer.setSource(originSource);
            }
            
            var bigJSONs = result.big;              
            var bigFeatures = new Array();
            bigJSONs.forEach(function(bj) {
                var bigFeature = new ol.format.GeoJSON().readFeature(bj);
                bigFeature.setStyle(createStyle('whu.jpeg', imgSize));
                bigFeatures.push(bigFeature);
            });
            var bigSource = new ol.source.Vector({
                projection: 'EPSG:900913'
            });
            bigSource.addFeatures(bigFeatures);
            bigLayer.setSource(bigSource);
            
            var smallJSONs = result.small;              
            var smallFeatures = new Array();
            smallJSONs.forEach(function(bj) {
                var smallFeature = new ol.format.GeoJSON().readFeature(bj);
                smallFeature.setStyle(createStyle('whu.jpeg', imgSize/4));
                smallFeatures.push(smallFeature);
            });
            var smallSource = new ol.source.Vector({
                projection: 'EPSG:900913'
            });
            smallSource.addFeatures(smallFeatures);
            smallLayer.setSource(smallSource);
            
            var fillJSONs = result.fill;
            var fillFeatures = new Array();
            fillJSONs.forEach(function(fj) {
               var fillFeature = new ol.format.GeoJSON().readFeature(fj);
               fillFeature.setStyle(createStyle('whu.jpeg', imgSize));
               fillFeatures.push(fillFeature);
            });
            var fillSource = new ol.source.Vector({
                projection: 'EPSG:900913'
            });
            fillSource.addFeatures(fillFeatures);
            fillLayer.setSource(fillSource);
              
            $scope.bigCount = bigFeatures.length;
            $scope.fillCount = fillFeatures.length;
            $scope.imgCount = result.count;
            var n = new Number($scope.bigCount/$scope.imgCount);
            $scope.bigPercent = n.toFixed(3);
            n = new Number(($scope.bigCount+$scope.fillCount)/$scope.imgCount);
            $scope.bigFillPercent = n.toFixed(3);
            var viewArea = document.getElementById('map').offsetHeight *
                           document.getElementById('map').offsetWidth;
            var c = new Number($scope.bigCount*imgSize*imgSize/viewArea);
            $scope.bigCov = c.toFixed(3);
            c = new Number(($scope.bigCount+$scope.fillCount)*imgSize*imgSize/viewArea);
            $scope.bigFillCov = c.toFixed(3);
            
            $scope.smallCount = smallFeatures.length;
            n = new Number($scope.smallCount/$scope.imgCount);
            $scope.smallPercent = n.toFixed(3);
            viewArea = document.getElementById('map').offsetHeight *
                           document.getElementById('map').offsetWidth;
            c = new Number($scope.smallCount*imgSize*imgSize/viewArea/4);
            $scope.smallCov = c.toFixed(3);
        });
        }
        
        var grids = drawGrid(level, mapExtent, imgSize);
        var gridSource = new ol.source.Vector({
            projection: 'EPSG:900913'
        });
        gridSource.addFeatures(grids);
        gridLayer.setSource(gridSource);
    }

    $scope.onSizeChange = redraw;
    $scope.onDSChange = redraw;
    map.getView().on('change:resolution', redraw);
    map.on('moveend', redraw);
});