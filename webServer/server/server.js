var express = require('express');
var server = express();
var port = process.env.PORT || 3000;
var serialize = require('serialize-javascript');

// needed when we get the ".jsx" files
require('node-jsx').install({
    extension: '.jsx'
});

// require the fluxible app
var app = require('../shared/app');
var React = require('react');
var HtmlComponent = React.createFactory(require('../shared/components/Html.jsx'));
var navigateAction = require('../shared/navigateAction');
var Router = require('react-router');


server.use(express.static(__dirname + '/../build'));

server.use(function(req, res, next) {
    var context = app.createContext();
    // start the react-router
    Router.run(app.getAppComponent(), req.path, function(Handler, state){
        var actionContext = context.getActionContext();
        actionContext.setRouteInfo({
            time: Date.now()
        });
        context.executeAction(navigateAction, state, function(){
            // for all registered stores, call the 'dehydrate' function
            var exposed = 'window.App=' + serialize(app.dehydrate(context)) + ';';
            React.withContext(context.getComponentContext(), function(){
                // render the appComponent to an 'html' template
                var html = React.renderToStaticMarkup(HtmlComponent({
                    state: exposed,
                    host: req.protocol + '://' + req.get('host') + '/',
                    markup: React.renderToString(React.createFactory(Handler)())
                }));
                res.write(html);
                res.end();
            });
        })
    });
});


server.listen(port);
console.log('Listening on port ' + port);
