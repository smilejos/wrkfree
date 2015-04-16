'use strict';
var Cookie = require('cookie');
var Promise = require('bluebird');
var Dispatcher = require('./dispatcher');
var SharedUtils = require('../../sharedUtils/utils');
var middlewareUtils = require('./middlewares/utils');
var StorageManager = require('../../storageService/storageManager');
// intialize db resource before getService
StorageManager.connectDb();

module.exports.run = function(worker) {
    // Get a reference to our realtime SocketCluster server
    var scServer = worker.getSCServer();
    var UserStorage = StorageManager.getService('User');

    /**
     * register middlewares
     */
    _configHandshake(scServer);
    _configSubscribe(scServer);
    _configEmit(scServer);

    /*
      In here we handle our incoming realtime connections and listen for events.
    */
    scServer.on('connection', function(socket) {
        var token = socket.getAuthToken();
        if (token) {
            UserStorage.userEnterAsync(token, socket.id);
        }

        socket.on('auth', function(cookieStr, callback) {
            return Promise.try(function() {
                var cookie = Cookie.parse(cookieStr);
                return [
                    cookie.uid,
                    middlewareUtils.isCookieSessionAuthAsync(cookie)
                ];
            }).spread(function(uid, isAuth) {
                if (isAuth) {
                    // configure uid as token
                    socket.setAuthToken(uid);
                    return UserStorage.userEnterAsync(uid, socket.id);
                }
                throw new Error('cookie auth fail');
            }).catch(function(err) {
                SharedUtils.printError('worker.js', 'event-auth', err);
                throw new Error('authentication fail').toString();
            }).nodeify(callback);
        });

        socket.on('req', function(data, res) {
            return Dispatcher(socket, data)
                .then(function(result) {
                    return res(result.error, result.data);
                });
        });

        socket.on('disconnect', function() {
            var token = socket.getAuthToken();
            return UserStorage.userLeaveAsync(token, socket.id);
        });
    });
};

/**
 * @Author: George_Chen
 * @Description: to configure the handshake related middlewares
 *
 * @param {Object}        server, the socket server instance
 */
function _configHandshake(server) {
    var middleware = require('./middlewares/handshake');
    var type = server.MIDDLEWARE_HANDSHAKE;
    server.addMiddleware(type, middleware.ensureWebLogin);
}

/**
 * @Author: George_Chen
 * @Description: to configure the subscribe related middlewares
 *
 * @param {Object}        server, the socket server instance
 */
function _configSubscribe(server) {
    var middleware = require('./middlewares/subscribe');
    var type = server.MIDDLEWARE_SUBSCRIBE;
    server.addMiddleware(type, middleware.ensureAuthed);
}

/**
 * @Author: George_Chen
 * @Description: to configure the emit related middlewares
 *
 * @param {Object}        server, the socket server instance
 */
function _configEmit(server) {
    var middleware = require('./middlewares/emit');
    var type = server.MIDDLEWARE_EMIT;
    server.addMiddleware(type, middleware.ensureLogin);
}
