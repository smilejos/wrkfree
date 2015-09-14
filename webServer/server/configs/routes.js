'use strict';
var Passport = require('passport');
var ExpressRouter = require('express').Router();
var SharedUtils = require('../../../sharedUtils/utils');
var LogUtils = require('../../../sharedUtils/logUtils');
var LogCategory = 'WEB';
var StorageManager = require('../../../storageService/storageManager');


module.exports = function(server) {
    var auth = require('./middlewares/authorization');
    var fileHandler = require('./middlewares/fileHandler');
    var userEntry = require('./middlewares/userEntry')(StorageManager);
    var reactRoute = require('./reactRoute');
    var providerParams = require('./passport/params');

    server.use(ExpressRouter);

    ExpressRouter.get('/app/signin', function(req, res) {
        res.send({
            hasSignIn: (req.user && req.user.uid)
        });
        res.end();
    });

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
        LogUtils.info(LogCategory, {
            method: req.method,
        }, 'new user attempt to signIn');
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
            route: req.nextRoute
        };
        if (!req.error) {
            LogUtils.info(LogCategory, {
                method: req.method,
                uid: req.user.uid
            }, 'user complete signIn');
            result.user = {
                uid: req.user.uid,
                nickName: req.user.nickName,
                avatar: req.user.avatar
            };
        } else {
            LogUtils.warn(LogCategory, {
                method: req.method
            }, 'user fail to signIn');
        }
        res.json(result);
        res.end('');
    });

    /**
     * handling logout
     */
    ExpressRouter.get('/app/logout', function(req, res) {
        LogUtils.info(LogCategory, {
            method: req.method,
            uid: req.user.uid
        }, 'user signOut');
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
        LogUtils.info(LogCategory, {
            method: req.method,
            uid: req.user.uid
        }, 'enter dashboard [' + req.url + ']');
        req.routeInfo = {
            user: req.user,
            storageManager: StorageManager
        };
        return reactRoute(req, res);
    });

    ExpressRouter.get('/app/workspace/:channelId', auth.ensureMember, function(req, res) {
        if (!req.query.board) {
            return res.redirect('/app/workspace/' + req.params.channelId + '?board=1');
        }
        LogUtils.info(LogCategory, {
            method: req.method,
            uid: req.user.uid,
            cid: req.params.channelId
        }, 'enter channel [' + req.url + ']');
        req.routeInfo = {
            user: req.user,
            channelId: req.params.channelId,
            storageManager: StorageManager
        };
        return reactRoute(req, res);
    });

    /**
     * used to serve channel boards image preview 
     *     NOTE: we always push latest updated board's preview image
     */
    ExpressRouter.get('/app/workspace/:channelId/preview', auth.ensureMember, fileHandler.getPreview, function(req, res) {
        LogUtils.debug(LogCategory, {
            method: req.method,
            uid: req.user.uid,
            cid: req.params.channelId
        }, 'get channel preview image');
        if (!req.img || req.img.chunks.length === 0) {
            // send image not found jpeg
            return res.redirect('/assets/imgs/empty.png');
        }
        res.contentType(req.img.contentType);
        res.send(req.img.chunks);
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

    ExpressRouter.get('/app/error', function(req, res) {
        req.routeInfo = {
            user: req.user
        };
        return reactRoute(req, res);
    });

    /**
     * for serving protected files,
     * ex: file request "https://localhost/app/build/bundle.js"
     *     will be replace as "https://localhost/protected/bundle.js"
     *     the nginx will take care of files under "protected", which is an internal location
     */
    ExpressRouter.get('/app/build/*', function(req, res) {
        LogUtils.debug(LogCategory, {
            method: req.method,
            uid: req.user.uid,
            url: req.url
        }, 'get provision files');
        res.setHeader('X-Accel-Redirect', req.url.replace('/app/build/', '/protected/'));
        res.end();
    });

    /**
     * for handling not found route request
     */
    ExpressRouter.use(function(req, res) {
        LogUtils.debug(LogCategory, {
            url: req.url,
            uid: req.user.uid
        }, 'not supported route');
        res.sendStatus(404);
    });
};
