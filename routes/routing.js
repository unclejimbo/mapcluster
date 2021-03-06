var index = require('./index');
var features = require('./features');

module.exports = function(app) {
    app.get('/', index.show);
    app.get('/features', features.findVisible);
    app.get('/features/all', features.all);
    app.get('/features/big', features.big);
    app.get('/features/big-fill', features.bigFill);
    app.get('/features/small', features.small);
    app.get('/features/small-fill', features.smallFill);
    app.post('/features', features.add);
    app.post('/features/update/:id', features.update);
};
