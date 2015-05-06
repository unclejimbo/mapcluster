/*
  Cluster an array of GeoJSON Features or FeatureCollection and gives
  none-overlapping results for rendering on a map.
  
  Parameters:
    geoJSONS   <Array(Feature Object) | FeatureCollection>
    extent     <Array(Number)> in forms of [minx, miny, max, maxy]
    zoom       <Number> the current zoom of the map
    (opt)size  <Number> size of the img in pixels, default 40px
    (opt)DS    <Number> distinctive score, ranging [0, 9], default 9

  Returns:
    <Array(Feature Object) | FeatureCollection> same as input

  Notes:
    1. Make sure you have "mCode" and "impScore" in field "properties".
       The field "mCode" should hold morton code computed in advance,
       and the field "impScore" specifies a point's value in clustering.
    2. Using extent to narrow down the area in which you want to cluster,
       by default it should be extent of the viewport.
    3. Set DS to 9 makes sure there's no overlap. Less DS value will return
       more points but potentially overlapping.
 */
function mapcluster(geoJSONs, extent, level, size, DS) {
    size = size || 40; DS = DS || 9;
    if (geoJSONs.type == 'FeatureCollection') 
        geoJSONs = geoJSONs.features;

    dScore(geoJSONs, level, extent);
    var clustered = new Array();
    for (var i = 0; i < geoJSONs.length; ++i) {
        if (geoJSONs[i].properties.dScore[level] >= DS)
            clustered.push(geoJSONs[i]);
    }
    return clustered;
}

/*
  function that computes the distinctive score of the features
  mapCluster is based on this dScore.
 */
function dScore(features, level, extent) {
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
            xt = x - x0;
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

