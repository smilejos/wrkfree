var Passport = require('passport');
var ExpressRouter = require('express').Router();
var SharedUtils = require('../../../sharedUtils/utils');



module.exports = function(server, StorageManager) {
    var userEntry = require('./middlewares/userEntry')(StorageManager);
    var reactRoute = require('./reactRoute');
    var providerParams = require('./passport/params');

    server.use(ExpressRouter);

    /**
     * handle the facebook oauth routes
     */
    ExpressRouter.get('/auth/facebook', Passport.authenticate('facebook'));
    ExpressRouter.get('/auth/facebook/callback', Passport.authenticate('facebook', {
        successRedirect: '/auth/success/facebook',
        failureRedirect: '/error'
    }));

    /**
     * handle the google oauth routes
     */
    ExpressRouter.get('/auth/google', Passport.authenticate('google', {
        scope: providerParams.get('google').scope
    }));
    ExpressRouter.get('/auth/google/callback', Passport.authenticate('google', {
        successRedirect: '/auth/success/google',
        failureRedirect: '/error'
    }));

    /**
     * handle the oauth login success flow
     */
    ExpressRouter.get('/auth/success/:provider', userEntry.enter, function(req, res) {
        if (!SharedUtils.isString(req.nextRoute)) {
            res.redirect('/error');
        }
        res.redirect(req.nextRoute);
    });

    /**
     * rendering user signup page
     */
    ExpressRouter.get('/app/signup', function(req, res) {
        req.routeInfo = {
            userInfo: req.session.passport.user || {}
        };
        return reactRoute(req, res);
    });

    /**
     * handling the submission of user signup
     */
    ExpressRouter.post('/app/signup', userEntry.create, function(req, res) {
        var result = {
            error: req.error,
            route: req.nextRoute
        };
        res.json(result);
        res.end('');
    });

    /**
     * makes "/app/dashboard" as an default app route
     */
    ExpressRouter.get('/app', function(req, res) {
        res.redirect('/app/dashboard');
    });

    ExpressRouter.get('/app/dashboard', function(req, res) {
        req.routeInfo = {};
        return reactRoute(req, res);
    });

    ExpressRouter.get('/app/channel/:channelId', function(req, res) {
        req.routeInfo = {};
        return reactRoute(req, res);
    });

    /**
     * for serving protected files,
     * ex: file request "https://localhost/app/build/bundle.js"
     *     will be replace as "https://localhost/protected/bundle.js"
     *     the nginx will take care of files under "protected", which is an internal location
     */
    ExpressRouter.get('/app/build/*', function(req, res) {
        res.setHeader('X-Accel-Redirect', req.url.replace('/app/build/', '/protected/'));
        res.end();
    });
};
