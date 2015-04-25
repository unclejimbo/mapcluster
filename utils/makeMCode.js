var cons = require('./constants');
var HALF_MERC = cons.HALF_MERC;
var MERC = cons.MERC;
var proj = require('./projection.js');

function makeMortonCode(feature, offset, level, numLevels, x0, y0) {
    var extent = cons.HALF_MERC / (Math.pow(2, level));
    var xy = feature.geometry.coordinates;
    if (level < numLevels) {
        if (xy[0] <= x0 && xy[1] <= y0) {
            feature.properties.mCode[offset][level] = 0;
            return makeMortonCode(feature, offset, level+1, numLevels, x0-extent,y0-extent);
        } else if (xy[0] > x0 && xy[1] <= y0) {
            feature.properties.mCode[offset][level] = 1;
            return makeMortonCode(feature, offset, level+1, numLevels, x0+extent,y0-extent);
        } else if (xy[0] <= x0 && xy[1] > y0) {
            feature.properties.mCode[offset][level] = 2;
            return makeMortonCode(feature, offset, level+1, numLevels, x0-extent,y0+extent);
        } else {
            feature.properties.mCode[offset][level] = 3;
            return makeMortonCode(feature, offset, level+1, numLevels, x0+extent,y0+extent);
        }
    } else return;
}

function featureShift(feature, xOffset, yOffset) {
    feature.geometry.coordinates[0] += xOffset;
    if (feature.geometry.coordinates[0] > HALF_MERC)
        feature.geometry.coordinates[0] -= MERC;
    feature.geometry.coordinates[1] += yOffset;
    if (feature.geometry.coordinates[1] > HALF_MERC)
        feature.geometry.coordinates[1] -= MERC;
}

function makeMCode(feature, numLevels) {
    var xOffset = [0,  MERC/3,  MERC/3,
                   0, -MERC/3, -MERC/3,
                   0,  MERC/3,  MERC/3];
    var yOffset = [     0, 0, 0,
                   MERC/3, 0, 0,
                   MERC/3, 0, 0];
    var lonlat = feature.geometry.coordinates;
    var xy = new Array(2);
    proj.lonlat2merc(lonlat, xy);
    feature.geometry.coordinates = xy;
    for (var i = 0; i < 9; ++i) {
        featureShift(feature, xOffset[i], yOffset[i]);
        makeMortonCode(feature, i, 0, numLevels, 0, 0);
    }
    feature.geometry.coordinates = lonlat;
}

module.exports = makeMCode;
