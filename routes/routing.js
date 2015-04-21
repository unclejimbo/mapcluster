var index = require('./index');
var poi = require('./poi');

module.exports = function(app) {
    app.get('/', index.show);
    app.get('/poi/all', poi.all);
};
