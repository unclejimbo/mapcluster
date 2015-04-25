var cons = require('./constants');

exports.lonlat2merc = function(lonlat, xy) {
    var lon = lonlat[0], lat = lonlat[1];
    var x = lon * cons.HALF_MERC / 180;
    var y =  Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
    y = y * cons.HALF_MERC / 180;
    xy[0] = x; xy[1] = y;
}
