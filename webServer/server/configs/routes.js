'use strict';
var Passport = require('passport');
var ExpressRouter = require('express').Router();
var SharedUtils = require('../../../sharedUtils/utils');
var StorageManager = require('../../../storageService/storageManager');


module.exports = function(server) {
    var auth = require('./middlewares/authorization');
    var userEntry = require('./middlewares/userEntry')(StorageManager);
    var reactRoute = require('./reactRoute');
    var providerParams = require('./passport/params');

    server.use(ExpressRouter);

    /**
     * ensure all routes start with '/app' will get authorized check
     */
    ExpressRouter.use('/app', auth.ensureAuthed);

    /**
     * handle the facebook oauth routes
     */
    ExpressRouter.get('/auth/facebook', Passport.authenticate('facebook', {
        scope: providerParams.getParams('facebook').scope
    }));

    ExpressRouter.get('/auth/facebook/callback', function(req, res, next) {
        req.provider = 'facebook';
        next();
    }, userEntry.oAuthLogin);

    /**
     * handle the google oauth routes
     */
    ExpressRouter.get('/auth/google', Passport.authenticate('google', {
        scope: providerParams.getParams('google').scope
    }));
    ExpressRouter.get('/auth/google/callback', function(req, res, next) {
        req.provider = 'google';
        next();
    }, userEntry.oAuthLogin);

    /**
     * rendering user signup page
     */
    ExpressRouter.get('/app/signup', userEntry.authToSignup, function(req, res) {
        req.routeInfo = {
            userInfo: req.user || {}
        };
        return reactRoute(req, res);
    });

    /**
     * handling the submission of user signup
     */
    ExpressRouter.post('/app/signup', userEntry.authToSignup, userEntry.create, function(req, res) {
        var result = {
            error: req.error,
            route: req.nextRoute,

        };
        if (!req.error) {
            result.user = {
                uid: req.user.uid,
                nickName: req.user.nickName,
                avatar: req.user.avatar
            };
        }
        res.json(result);
        res.end('');
    });

    /**
     * handling logout
     */
    ExpressRouter.get('/app/logout', function(req, res) {
        req.session.destroy(function(err) {
            if (err) {
                SharedUtils.printError('routes', '/app/logout', err);
            }
            // clear all cookies
            SharedUtils.fastArrayMap(Object.keys(req.cookies), function(field) {
                res.clearCookie(field);
            });
            res.redirect('/');
        });
    });

    /**
     * makes "/app/dashboard" as an default app route
     */
    ExpressRouter.get('/app', function(req, res) {
        res.redirect('/app/dashboard');
    });

    ExpressRouter.get('/app/dashboard', function(req, res) {
        req.routeInfo = {
            user: req.user,
            storageManager: StorageManager
        };
        return reactRoute(req, res);
    });
    
    ExpressRouter.get('/app/channel/:channelId', auth.ensureMember, function(req, res) {
        req.routeInfo = {
            user: req.user,
            channelId: req.params.channelId,
            storageManager: StorageManager
        };
        return reactRoute(req, res);
    });

    /**
     * used to check specific "email" is available or not
     * NOTE:
     * status code = 200 is success response, means user email can be applied
     * status code = 403 is an forbiden error, means user email has been occupied
     */
    ExpressRouter.get('/app/checkuser', userEntry.isEmailAvailable, function(req, res) {
        if (req.error) {
            res.redirect(req.nextRoute);
        }
        var statusCode = (req.uidAvailable ? 200 : 406);
        res.status(statusCode).end();
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

    /**
     * for handling not found route request
     */
    ExpressRouter.use(function(req, res){
        res.send(404);
    });
};
