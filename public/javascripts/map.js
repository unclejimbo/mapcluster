var MERC = 40075016.68;
var HALF_MERC = 20037508.34;
var PI = 245850922 / 78256779;
var MAX_ZOOM = 20;

// cluster is based on this distinctive score
function dScore(features, level, index) {
    var xOffset = [       0,   MERC/3, 2*MERC/3,
                   2*MERC/3,   MERC/3,        0,
                          0,        0, 2*MERC/3];
    var yOffset = [       0,        0,        0,
                     MERC/3,   MERC/3,   MERC/3,
                   2*MERC/3, 2*MERC/3, 2*MERC/3];
    var left = bbox.left + xOffset[index];
    var right = bbox.right + xOffset[index];
    var top = bbox.top + yOffset[index];
    var bottom = bbox.bottom + yOffset[index];
    var gridLen = HALF_MERC/(Math.pow(2,level));
    var x0 = Math.floor((left+HALF_MERC)/gridLen) - 1;
    var x1 = Math.floor((right+HALF_MERC)/gridLen) + 1;
    var y0 = Math.floor((top+HALF_MERC)/gridLen) - 1;
    var y1 = Math.floor((bottom+HALF_MERC)/gridLen) + 1;
    var vipArr = new Array(x2-x1+1);
    for (var i = 0; i < vipArr.length; ++i) {
        vipArr[i] = new Array(y2-y1+1);
        for (var j = 0; j < vipArr[i].length; ++j) {
            vipArr[i][j] = new ol.Feature();
            vipArr[i][j].setProperties({impScore: -1});
        }
    }
    
}

var map = new ol.Map({
    view: new ol.View({
        center: [0, 0],
        zoom: 4,
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
var mapExtent = map.getView().calculateExtent(map.getSize());
app.controller('mapCtrl', function($http) {
    $http({url: 'http://localhost:3000/features',
           method: 'GET',
           params: {xmin: mapExtent[0],
                    ymin: mapExtent[1],
                    xmax: mapExtent[2],
                    ymax: mapExtent[3]}}).success(function(res) {
        var cnt = 0;
        var originSource = new ol.source.Vector();
        res.forEach(function(fj) {
            var originFeature = new ol.format.GeoJSON().readFeature(fj, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:900913'
            });
            originSource.addFeature(originFeature);
            ++cnt;
            // uncomment this when you import geojson files into
            // mongodb and need to update mCode
            /* var url = 'http://localhost:3000/features/update/' + fj.id;
            $http.post(url, {feature: fj}); */
        });
        var originLayer = new ol.layer.Vector({
            source: originSource,
            title: 'Origin Layer'
        });
        map.addLayer(originLayer);

        var smallSource = new ol.source.Vector();
        var smallLayer = new ol.layer.Vector({
            source: smallLayer,
            title: 'Small Layer'
        });
    });
});
