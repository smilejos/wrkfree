var ExpressRouter = require('express').Router();
var Passport = require('passport');
var ReactRoute = require('./middlewares/reactRoute');

module.exports = function (server) {
    server.use(ExpressRouter);

    ExpressRouter.get('/auth/facebook', Passport.authenticate('facebook'));
    ExpressRouter.get('/auth/facebook/callback', Passport.authenticate('facebook', {
        successRedirect: '/success',
        failureRedirect: '/error'
    }));

    ExpressRouter.get('/success', function(req, res){
        res.end('Hello world')
    });

    /**
     * makes "/app/dashboard" as an default app route
     */
    ExpressRouter.get('/app', function(req, res){
        res.redirect('/app/dashboard');
    });

    ExpressRouter.get('/app/signup', ReactRoute, function(req, res){
        res.end();
    });

    ExpressRouter.get('/app/dashboard', ReactRoute, function(req, res){
        res.end();
    });

    ExpressRouter.get('/app/channel/:channelId', ReactRoute, function(req, res){
        res.end();
    });

    /**
     * for serving protected files,
     * ex: file request "https://localhost/app/build/bundle.js" 
     *     will be replace as "https://localhost/protected/bundle.js"
     *     the nginx will take care of files under "protected", which is an internal location
     */
    ExpressRouter.get('/app/build/*', function(req, res){
        res.setHeader('X-Accel-Redirect', req.url.replace('/app/build/', '/protected/'));
        res.end();
    });
};