'use strict';
var React = require('react');
var Router = require('react-router');
var NavigateAction = require('../../shared/navigateAction');
var Serialize = require('serialize-javascript');
var App = require('../../shared/app');

var LogUtils = require('../../../sharedUtils/logUtils');
var LogCategory = 'WEB';

var FluxibleComponent = require('fluxible-addons-react/FluxibleComponent');
var HtmlComponent = React.createFactory(require('../../shared/components/Html.jsx'));

module.exports = function(req, res) {
    // start the react-router
    Router.run(App.getComponent(), req.path, function(Handler, state) {
        var context = App.createContext();
        // set the route info for react-router to route
        context.getActionContext().setRouteInfo(req.routeInfo);
        return context.executeAction(NavigateAction, state)
            .then(function() {
                // for all registered stores, call the 'dehydrate' function
                var exposed = 'window.App=' + Serialize(App.dehydrate(context)) + ';';
                var component = React.createFactory(Handler);
                var props = {
                    context: context.getComponentContext()
                };
                var html = React.renderToStaticMarkup(HtmlComponent({
                    state: exposed,
                    host: '/app/build/',
                    markup: React.renderToString(
                        React.createElement(FluxibleComponent, props, component())
                    )
                }));
                res.send(html);
                res.end();
            }).catch(function(err) {
                LogUtils.error(LogCategory, {
                    user: req.user,
                    routeInfo: req.routeInfo,
                    url: req.url,
                    error: err.toString()
                }, 'react route error on server side');
                // we should redirect to error page
                res.end();
            });
    });
};
