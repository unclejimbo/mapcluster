var MERC = 40075016.68;
var HALF_MERC = 20037508.34;
var PI = 245850922 / 78256779;
var MAX_ZOOM = 20;

// cluster is based on this distinctive score
// feature should be an array of GeoJSON feature objects
function dScore(features, level, extent) {
    ++level;
    var xOffset = [       0,   MERC/3, 2*MERC/3,
                   2*MERC/3,   MERC/3,        0,
                          0,   MERC/3, 2*MERC/3];
    var yOffset = [       0,        0,        0,
                     MERC/3,   MERC/3,   MERC/3,
                   2*MERC/3, 2*MERC/3, 2*MERC/3];
    for (var index = 0; index < 9; ++index) {
        var left = extent[0] + xOffset[index];
        var bottom = extent[1] + yOffset[index];
        var right = extent[2] + xOffset[index];
        var top = extent[3] + yOffset[index];
        var gridLen = MERC/(Math.pow(2,level));
        // x, y are grid coords
        var x0 = Math.floor((left+HALF_MERC)/gridLen) - 1;
        var x1 = Math.floor((right+HALF_MERC)/gridLen) + 1;
        var y0 = Math.floor((bottom+HALF_MERC)/gridLen) - 1;
        var y1 = Math.floor((top+HALF_MERC)/gridLen) + 1;
        var vipArr = new Array(x1-x0+1);
        for (var i = 0; i < vipArr.length; ++i) {
            vipArr[i] = new Array(y1-y0+1);
            for (var j = 0; j < vipArr[i].length; ++j) {
                vipArr[i][j] = -1;
            }
        }
        for (var i = 0; i < features.length; ++i) {
            var x = 0, y = 0;
            var xt, yt;
            for (var j = 0; j <= level; ++j) {
                switch (features[i].properties.mCode[index][j]) {
                    case 0: x += Math.pow(2, level-j)*0;
                            y += Math.pow(2, level-j)*0; break;
                    case 1: x += Math.pow(2, level-j)*1;
                            y += Math.pow(2, level-j)*0; break;
                    case 2: x += Math.pow(2, level-j)*0;
                            y += Math.pow(2, level-j)*1; break;
                    case 3: x += Math.pow(2, level-j)*1;
                            y += Math.pow(2, level-j)*1; break;
                }
            }
            //x < x0 ? xt = x - x0 + Math.pow(2, level+1) :
                     xt = x - x0;
            // y < y0 ? yt = y - y0 + Math.pow(2, level+1) :
                     yt = y - y0;
            var feature = new ol.format.GeoJSON().readFeature(features[i], {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:900913'
            });
            var coord = feature.getGeometry().getCoordinates();
            if (features[i].properties.impScore > vipArr[xt][yt]) 
                vipArr[xt][yt] = features[i];
        }
        for (var i = 0; i < vipArr.length; ++i) {
            for (var j = 0; j < vipArr[i].length; ++j) {
                if (vipArr[i][j] != -1) 
                    ++vipArr[i][j].properties.dScore[level];
            }
        }
    }
}

function quadTreeCluster(features, level, DS) {
    var clustered = new Array();
    for (var i = 0; i < features.length; ++i) {
        if (features[i].getProperties().dScore[level+1] >= DS)
            clustered.push(features[i]);
    }
    return clustered;
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
        dScore(JSONs, zoom+2, mapExtent);
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

        var bigSource = new ol.source.Vector({
            projection: 'EPSG:900913'
        });
        var bigFeatures = quadTreeCluster(originFeatures, zoom+2, 9);
        bigSource.addFeatures(bigFeatures);
        var bigLayer = new ol.layer.Vector({
            source: bigSource,
            title: 'Big Layer'
        });
        map.addLayer(bigLayer);
    });
});
