var React = require('react');
var Fluxible = require('fluxible');
var routePlugin = require('./plugins/routePlugin');
var storePlugin = require('./plugins/storePlugin');
// 
/**
 * create an fluxible application
 */
var app = new Fluxible({
    appComponent: require('./components/Routes.jsx')
});

/**
 * import the data plugin
 */
app.plug(routePlugin);
app.plug(storePlugin);

/**
 * register stores
 */
app.registerStore(require('./stores/MainAppStore'));
 
module.exports = app;