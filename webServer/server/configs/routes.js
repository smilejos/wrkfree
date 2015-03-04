var ExpressRouter = require('express').Router();
var Passport = require('passport');
var SharedUtils = require('../../../sharedUtils/utils');




module.exports = function (server, StorageManager) {
    var userEntry = require('./middlewares/userEntry')(StorageManager);
    var reactRoute = require('./middlewares/reactRoute');
    
    server.use(ExpressRouter);

    ExpressRouter.get('/auth/facebook', Passport.authenticate('facebook'));
    ExpressRouter.get('/auth/facebook/callback', Passport.authenticate('facebook', {
        successRedirect: '/auth/success',
        failureRedirect: '/error'
    }));

    /**
     * handle the facebook login success flow
     */
    ExpressRouter.get('/auth/success', userEntry.enter, function(req, res){
        if (!SharedUtils.isString(req.nextRoute)) {
            res.redirect('/error');
        }
        res.redirect(req.nextRoute);
    });

    /**
     * handle the user signup flow
     */
    ExpressRouter.get('/app/signup', function(req, res){
        req.routeInfo = {
            userInfo: req.cookies.user
        };
        return reactRoute(req, res);
    });

    /**
     * makes "/app/dashboard" as an default app route
     */
    ExpressRouter.get('/app', function(req, res){
        res.redirect('/app/dashboard');
    });

    ExpressRouter.get('/app/dashboard', function(req, res){
        req.routeInfo = {};        
        return reactRoute(req, res);
    });

    ExpressRouter.get('/app/channel/:channelId', function(req, res){
        req.routeInfo = {};        
        return reactRoute(req, res);
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