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
        size: [size,size],
        offset: [0,0],
        offsetOrigin: 'top-left'
    });
    var style = new ol.style.Style({
        image: img
    });
    return style;
}

function drawGrid(zoom, extent, size) {
    size = size || 40;
    var level = zoom;
    var resolution = MAX_RESOLUTION / Math.pow(2, level);
    var gridLen; 
    do {
        gridLen = HALF_MERC / Math.pow(2, level);
        var imgLen = size * resolution;
        var outer = gridLen * 2 / 3;
        var inner = gridLen * 1 / 3;   
        if (imgLen > outer)
            --level;
        if (imgLen < inner)
            ++level;
    } while (imgLen > outer || imgLen < inner)
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

/*var gridLayer = new ol.layer.Vector({
    title: 'Grid Layer'
});
map.addLayer(gridLayer);*/
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
/*var smallLayer = new ol.layer.Vector({
    title: 'Small Layer'
});
map.addLayer(smallLayer);*/
var bigLayer = new ol.layer.Vector({
    title: 'Big Layer'
});
map.addLayer(bigLayer);
var triLayer = new ol.layer.Vector({
    title: 'Tri Layer'
});
map.addLayer(triLayer);

var app = angular.module('myApp', []);
app.controller('mapCtrl', function($scope, $http) {
    // uncomment this when you import geojson files into mongodb
    // and need to initialize feature properties, including mortonCode
    /* $http.get('http://localhost:3000/features/all').success(function(res) {
        res.forEach(function(fj) {
            var url = 'http://localhost:3000/features/update/' + fj.id;
            $http.post(url, {feature: fj});
        });
    }); */
    function redraw() {   
        var imgSize = $scope.imgSize || 40;
        var dScore = $scope.dScore || 9;
        var mapExtent = map.getView().calculateExtent(map.getSize());
        var zoom = map.getView().getZoom();
        var gridLen = HALF_MERC / Math.pow(2, zoom + 1);
        var promise = $http({url: 'http://localhost:3000/features',
                             method: 'GET',
                             params: {xmin: mapExtent[0] - gridLen,
                                      ymin: mapExtent[1] - gridLen,
                                      xmax: mapExtent[2] + gridLen,
                                      ymax: mapExtent[3] + gridLen}});
        promise.success(function(JSONs) {       
            var originSource = new ol.source.Vector();
            var originFeatures = new Array();
            JSONs.forEach(function(fj) {
                var originFeature = new ol.format.GeoJSON().readFeature(fj, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:900913'
                });
                originFeatures.push(originFeature);
            });
            originSource.addFeatures(originFeatures);
            originLayer.setSource(originSource);
            $scope.imgCount = originFeatures.length;

            var d = new Date();
            var start = d.getTime();
            var bigJSONs = mapcluster(JSONs, mapExtent, zoom, imgSize, dScore);
            var d = new Date();
            var end = d.getTime();
            var bigFeatures = new Array();
            bigJSONs.forEach(function(bj) {
                var bigFeature = new ol.format.GeoJSON().readFeature(bj, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:900913'
                });
                bigFeature.setStyle(createStyle(bj.properties.imgUrl, imgSize));
                bigFeatures.push(bigFeature);
            });
            var bigSource = new ol.source.Vector({
                projection: 'EPSG:900913'
            });
            bigSource.addFeatures(bigFeatures);
            bigLayer.setSource(bigSource);
            $scope.bigCount = bigFeatures.length;
            $scope.bigTime = (end - start) / 1000;
            var n = new Number($scope.bigCount/$scope.imgCount);
            $scope.bigPercent = n.toFixed(3);
            var viewArea = document.getElementById('map').offsetHeight *
                           document.getElementById('map').offsetWidth;
            var c = new Number($scope.bigCount*imgSize*imgSize/viewArea);
            $scope.bigCov = c.toFixed(3);
            
            var bigCoords = new Array();
            bigJSONs.forEach(function(bj) {
                var bf = new ol.format.GeoJSON().readFeature(bj, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:900913'
                });
                bigCoords.push(bf.getGeometry().getCoordinates());
            });
            var tris = Delaunay.triangulate(bigCoords);
            var triSource = new ol.source.Vector({
                projection: 'EPSG:900913'
            });
            for (var i = 0; i < tris.length; ) {
                var lr = new ol.geom.LinearRing([bigCoords[tris[i++]], 
                                                 bigCoords[tris[i++]], 
                                                 bigCoords[tris[i++]]]);
                var tri = new ol.geom.Polygon([[]]);
                tri.appendLinearRing(lr);
                var triFeature = new ol.Feature(tri);
                triSource.addFeature(triFeature);
            }
            triLayer.setSource(triSource);
            /*var d = new Date();
            var start = d.getTime();
            var smallJSONs = mapcluster(JSONs, mapExtent, zoom+2, imgSize, dScore);
            var d = new Date();
            var end = d.getTime();
            var smallFeatures = new Array();
            smallJSONs.forEach(function(sj) {
                var smallFeature = new ol.format.GeoJSON().readFeature(sj, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:900913'
                });
                smallFeature.setStyle(createStyle(sj.properties.imgUrl, imgSize/4));
                smallFeatures.push(smallFeature);
            });
            var smallSource = new ol.source.Vector({
                projection: 'EPSG:900913'
            });
            smallSource.addFeatures(smallFeatures);
            smallLayer.setSource(smallSource);
            $scope.smallCount = smallFeatures.length;
            $scope.smallTime = (end - start) / 1000;
            var n = new Number($scope.smallCount/$scope.imgCount);
            $scope.smallPercent = n.toFixed(3);
            var c = new Number($scope.smallCount*imgSize*imgSize/viewArea/4);
            $scope.smallCov = c.toFixed(3);
            
            var grids = drawGrid(zoom, mapExtent, imgSize);
            var gridSource = new ol.source.Vector({
                projection: 'EPSG:900913'
            });
            gridSource.addFeatures(grids);
            gridLayer.setSource(gridSource);*/
        });
    }

    $scope.onSizeChange = redraw;
    $scope.onDSChange = redraw;
    map.getView().on('change:resolution', redraw);
    map.on('moveend', redraw);
});