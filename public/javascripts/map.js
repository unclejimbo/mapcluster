var MERC = 40075016.68;
var HALF_MERC = 20037508.34;
var PI = 245850922 / 78256779;
var MAX_ZOOM = 20;

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

var app = angular.module('myApp', []);
app.controller('mapCtrl', function($http) {
    // uncomment this when you import geojson files into mongodb
    // and need to initialize feature properties, including mortonCode
    /* $http.get('http://localhost:3000/features/all').success(function(res) {
        res.forEach(function(fj) {
            var url = 'http://localhost:3000/features/update/' + fj.id;
            $http.post(url, {feature: fj});
        });
    }); */
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
        var originLayer = new ol.layer.Vector({
            source: originSource,
            title: 'Origin Layer'
        });
        map.addLayer(originLayer);

         var fill = new ol.style.Fill({
           color: [255,0,0,0.3]
         });
         var stroke = new ol.style.Stroke({
           color: [255.0,0,1],
           width: 1.25
         });
        var img = new ol.style.Icon({
            src: '/images/1.jpg',
            size: [40,40]
        });
         var styles = [
           new ol.style.Style({
             image: img,
             fill: fill,
             stroke: stroke
           })
         ];
        var bigJSONs = mapcluster(JSONs, mapExtent, zoom);
        var bigFeatures = new Array();
        bigJSONs.forEach(function(bj) {
            var bigFeature = new ol.format.GeoJSON().readFeature(bj, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:900913'
            });
            bigFeatures.push(bigFeature);
        });
        var bigSource = new ol.source.Vector({
            projection: 'EPSG:900913'
        });
        bigSource.addFeatures(bigFeatures);
        var bigLayer = new ol.layer.Vector({
            source: bigSource,
            title: 'Big Layer',
            style: styles[0]
        });
        map.addLayer(bigLayer);
    });
});
