var index = require('./index');
var features = require('./features');

module.exports = function(app) {
    app.get('/', index.show);
    app.get('/features', features.show);
    app.get('/features/all', features.all);
    app.post('/features', features.saveone);
    app.post('/features/update/:id', features.update);
};
