var MERC = 40075016.68;
var HALF_MERC = 20037508.34;
var PI = 245850922 / 78256779;

function getPixelXY(feature)　{
    var point = feature.getGeometry();
    var coord = point.getCoordinates();
    var x = coord[0], y = coord[1];
}

var map = new ol.Map({
    view: new ol.View({
        center: [0, 0],
        zoom: 1
    }),
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    target: 'map'
});

var app = angular.module('myApp', []);
app.controller('mapCtrl', function($http) {
    $http.get('http://localhost:3000/features/all').success(function(res) {
        var originSource = new ol.source.Vector();
        res.forEach (function(fj) {
            var originFeature = new ol.format.GeoJSON().readFeature(fj,{
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:900913'
            });
            originSource.addFeature(originFeature);
            // uncomment this when you import geojson files into
            // mongodb and need to update mCode
            /* var url = 'http://localhost:3000/features/update/' + fj.id;
            $http.post(url, {feature: fj}); */
        });
        var originLayer = new ol.layer.Vector({source: originSource});
        map.addLayer(originLayer);
    });
});
