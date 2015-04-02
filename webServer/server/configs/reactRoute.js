'use strict';
var React = require('react');
var Router = require('react-router');
var NavigateAction = require('../../shared/navigateAction');
var Serialize = require('serialize-javascript');
var App = require('../../shared/app');

var HtmlComponent = React.createFactory(require('../../shared/components/Html.jsx'));

module.exports = function(req, res) {
    var context = App.createContext();
    // set the route info for react-router to route
    context.getActionContext().setRouteInfo(req.routeInfo);

    // start the react-router
    Router.run(App.getAppComponent(), req.path, function(Handler, state){

        context.executeAction(NavigateAction, state, function(){
            // for all registered stores, call the 'dehydrate' function
            var exposed = 'window.App=' + Serialize(App.dehydrate(context)) + ';';

            React.withContext(context.getComponentContext(), function(){
                // render the appComponent to an 'html' template
                var html = React.renderToStaticMarkup(HtmlComponent({
                    state: exposed,
                    host: 'https://' + req.get('host') + '/app/build/',
                    markup: React.renderToString(React.createFactory(Handler)())
                }));
                res.write(html);
                res.end();
            });
        });
    });
};

