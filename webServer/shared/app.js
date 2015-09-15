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
app.registerStore(require('./stores/HeaderStore'));
app.registerStore(require('./stores/SignUpStore'));
app.registerStore(require('./stores/SubscriptionStore'));
app.registerStore(require('./stores/DashboardStore'));
app.registerStore(require('./stores/MessageStore'));
app.registerStore(require('./stores/WorkSpaceStore'));
app.registerStore(require('./stores/FriendStore'));
app.registerStore(require('./stores/PersonalStore'));
app.registerStore(require('./stores/DrawStore'));
app.registerStore(require('./stores/DrawTempStore'));
app.registerStore(require('./stores/QuickSearchStore'));
app.registerStore(require('./stores/InfoCardStore'));
app.registerStore(require('./stores/WebcamStore'));
app.registerStore(require('./stores/ConferenceStore'));
app.registerStore(require('./stores/EventToasterStore'));
app.registerStore(require('./stores/NotificationStore'));
app.registerStore(require('./stores/HangoutStore'));
app.registerStore(require('./stores/PreviewStore'));
app.registerStore(require('./stores/ChannelCreatorStore'));
app.registerStore(require('./stores/ChannelVisitorStore'));
app.registerStore(require('./stores/TourGuideStore'));
app.registerStore(require('./stores/DrawStatusStore'));
module.exports = app;
