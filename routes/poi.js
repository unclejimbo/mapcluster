var Poi = require('../models/poi')
exports.all = function(req, res) {
    res.send(Poi.findAll(function (err, pois) {
        if (err)
            return console.error(err);
        return pois;
    }));
};
