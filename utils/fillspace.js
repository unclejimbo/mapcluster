var FillSpace;
(function() {
    var HALF_MERC = 20037508.34,
	    MERC = 40075016.68;
	var vipArr;
	
	// check if the point (x, y) fits with grid (xg, yg)
	function checkGrid(xg, yg, x, y, size) {
		if (vipArr[xg][yg] == -1)
		    return true;
		else {
			var xp = vipArr[xg][yg].geometry.coordinates[0],
			    yp = vipArr[xg][yg].geometry.coordinates[1];
			if (Math.abs(xp - x) > size ||
			    Math.abs(yp - y) > size)
			    return true;
			else
			    return false;
		}
	}
		
	FillSpace = {
		fill : function(features, extent, level, size) {
			var gridLen = MERC / Math.pow(2, level),
			    left = extent[0], bottom = extent[1],
				right = extent[2], top = extent[3],
			    x0 = Math.floor((left+HALF_MERC)/gridLen) - 1,
	            x1 = Math.floor((right+HALF_MERC)/gridLen) + 1,
	            y0 = Math.floor((bottom+HALF_MERC)/gridLen) - 1,
	            y1 = Math.floor((top+HALF_MERC)/gridLen) + 1;
				
		    // initialize vipArr
			vipArr = new Array(x1-x0+1);		
	        for (var i = 0; i < vipArr.length; ++i) {
	            vipArr[i] = new Array(y1-y0+1);
	            for (var j = 0; j < vipArr[i].length; ++j) {
	                vipArr[i][j] = -1;
	            }
	        }
			
			features.sort(function(i, j) {
				return j.properties.dScore[level] -
				       i.properties.dScore[level];
			});
			
			features.forEach(function(f) {
				var x  = f.geometry.coordinates[0],
				    y  = f.geometry.coordinates[1],
					xt = Math.floor((x+HALF_MERC)/gridLen),
					yt = Math.floor((y+HALF_MERC)/gridLen),
					dx = xt - x0,
					dy = yt - y0;
				if (f.properties.isBig) {	
					// record big features
				    vipArr[dx][dy] = f;
				} else if (vipArr[dx][dy] == -1) {
					// check whether there is enough space for this feature
					var isAvailabe = true;
					if (dx > 0) {
						isAvailabe &= checkGrid(dx - 1, dy, x, y, size);
						if (dy > 0)
						    isAvailabe &= checkGrid(dx - 1, dy - 1, x, y, size);
						if (dy < y1 - y0)
						    isAvailabe &= checkGrid(dx - 1, dy + 1, x, y, size);
					}
					if (dx < x1 - x0) {
						isAvailabe &= checkGrid(dx + 1, dy, x, y, size);
						if (dy > 0)
						    isAvailabe &= checkGrid(dx + 1, dy - 1, x, y, size);
						if (dy < y1 - y0)
						    isAvailabe &= checkGrid(dx + 1, dy + 1, x, y, size);
					}
					if (dy > 0)
					    isAvailabe &= checkGrid(dx, dy - 1, x, y, size);
					if (dy < y1 - y0)
					    isAvailabe &= checkGrid(dx, dy + 1, x, y, size);
					if (size < gridLen / 2)
					    isAvailabe &= checkGrid(dx, dy, x, y, size);
						
					if (isAvailabe) {
						vipArr[dx][dy] = f;
					}
				}
			});
			
			var results = new Array();
			for (var i = 0; i < vipArr.length; ++i) {
				for (var j = 0; j < vipArr[i].length; ++j) {
					if (vipArr[i][j] != -1 && vipArr[i][j].properties.isBig == false)
					    results.push(vipArr[i][j]);
				}
			}
			return results;
		}
	}
	if (typeof module != "undefined")
	  module.exports = FillSpace;
})();