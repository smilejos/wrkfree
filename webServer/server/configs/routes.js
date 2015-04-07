var Passport = require('passport');
var ExpressRouter = require('express').Router();
var SharedUtils = require('../../../sharedUtils/utils');



module.exports = function(server, StorageManager) {
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
    ExpressRouter.get('/auth/facebook/callback', Passport.authenticate('facebook', {
        successRedirect: '/auth/success/facebook',
        failureRedirect: '/error'
    }));

    /**
     * handle the google oauth routes
     */
    ExpressRouter.get('/auth/google', Passport.authenticate('google', {
        scope: providerParams.getParams('google').scope
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
     * handling logout
     */
    ExpressRouter.get('/app/logout', function(req, res) {
        req.session.destroy(function(err) {
            if (err) {
                SharedUtils.printError('routes', '/app/logout', err);
            }
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
            user: req.session.passport.user,
            storageManager: StorageManager
        };
        return reactRoute(req, res);
    });

    ExpressRouter.get('/app/channel/:channelId', function(req, res) {
        req.routeInfo = {
            user: req.session.passport.user,
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
};
