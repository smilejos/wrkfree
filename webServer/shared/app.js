var React = require('react');
var Fluxible = require('fluxible');
var routePlugin = require('./plugins/routePlugin');
var storePlugin = require('./plugins/storePlugin');
// 
/**
 * create an fluxible application
 */
var app = new Fluxible({
    component: require('./components/Routes.jsx')
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
app.registerStore(require('./stores/SignUpStore'));
app.registerStore(require('./stores/channelInfoStore'));
app.registerStore(require('./stores/userInfoStore'));
app.registerStore(require('./stores/privateBoxesStore'));
app.registerStore(require('./stores/friendStore'));

module.exports = app;
