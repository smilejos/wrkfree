'use strict';
var Cookie = require('cookie');
var Promise = require('bluebird');
var Env = process.env.NODE_ENV || 'development';

/**
 * setup configurations for each worker
 */
var Configs = require('../../configs/config');
Configs.import('params', require('../../configs/parameters.json'));
Configs.import('db', require('../../configs/db.json')[Env]);

var StorageManager = require('../../storageService/storageManager');
// intialize db resource before internal modules
StorageManager.connectDb();

var Dispatcher = require('./dispatcher');
var SharedUtils = require('../../sharedUtils/utils');
var middlewareUtils = require('./middlewares/utils');

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
    _configPublish(scServer);
    _configPublishOut(scServer);

    /**
     * configure rtc worker
     */
    require('./services/rtcWorker').setSocketWorker(worker);

    /**
     * @Author: George_Chen
     * @Description: for handling CTRL+C event
     */
    process.on('SIGINT', function() {
        _workerExit(scServer);
    });

    /**
     * @Author: George_Chen
     * @Description: to do a hot reset on current worker
     */
    process.on('SIGUSR2', function() {
        _workerReset();
    });

    /**
     * @Author: George_Chen
     * @Description: for handling fatal error on worker
     */
    worker.on('error', function() {
        _workerReset();
    });

    /**
     * @Author: George_Chen
     * @Description: reset current worker
     */
    function _workerReset() {
        var sockets = scServer.clients;
        var socketIds = Object.keys(sockets);
        SharedUtils.fastArrayMap(socketIds, function(sid) {
            sockets[sid].disconnect();
        });
    }

    /**
     * @Author: George_Chen
     * @Description: to do a cold shutdown on current worker
     *
     * @param {String}        uid, the uid of current socket
     * @param {String}        sid, the current socket id
     * @param {Array}         subscriptions, a array of socket subscriptions
     */
    function _workerExit() {
        var sockets = scServer.clients;
        var socketIds = Object.keys(sockets);
        Promise.map(socketIds, function(sid) {
            var uid = sockets[sid].getAuthToken();
            var subscriptions = sockets[sid].subscriptions();
            delete sockets[sid];
            return _userLeaveAsync(uid, sid, subscriptions);
        }).then(function() {
            process.exit(0);
        });
    }

    /**
     * @Author: George_Chen
     * @Description: for handling user leave mechanism
     *
     * @param {String}        uid, the uid of current socket
     * @param {String}        sid, the current socket id
     * @param {Array}         subscriptions, a array of socket subscriptions
     */
    function _userLeaveAsync(uid, sid, subscriptions) {
        return Promise.join(
            UserStorage.userLeaveAsync(uid, sid),
            _disconnectChannel(sid, subscriptions),
            function(isLeft) {
                return isLeft;
            });
    }

    /*
      In here we handle our incoming realtime connections and listen for events.
    */
    scServer.on('connection', function(socket) {
        var token = socket.getAuthToken();
        if (token) {
            UserStorage.userEnterAsync(token, socket.id)
                .then(function() {
                    return _publishUserOnlineStatus(socket, token, true);
                });
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
                    return UserStorage.userEnterAsync(uid, socket.id)
                        .then(function() {
                            return _publishUserOnlineStatus(socket, uid, true);
                        });
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
            var uid = socket.getAuthToken();
            var subscriptions = socket.subscriptions();
            return _userLeaveAsync(uid, socket.id, subscriptions)
                .then(function(isUserLeft) {
                    if (isUserLeft === 1) {
                        return _publishUserOnlineStatus(socket, uid, false);
                    }
                }).catch(function(err) {
                    SharedUtils.printError('worker.js', 'disconnect', err);
                });
        });
    });
};

/**
 * @Author: George_Chen
 * @Description: to disconnect channel while user offline
 *         NOTE: now only deal with disconnect on rtc functionality
 * 
 * @param {String}        socketId, the client socket id
 * @param {Array}         subscriptions, subscription channels
 */
function _disconnectChannel(socketId, subscriptions) {
    var rtcStorage = StorageManager.getService('Rtc');
    return Promise.map(subscriptions, function(subscription) {
        var info = subscription.split(':');
        if (info[0] === 'channel') {
            return rtcStorage.delClientAsync(info[1], socketId);
        }
    });
}

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

/**
 * @Author: George_Chen
 * @Description: to configure the publish related middlewares
 *
 * @param {Object}        server, the socket server instance
 */
function _configPublish(server) {
    var middleware = require('./middlewares/publishIn');
    var type = server.MIDDLEWARE_PUBLISH_IN;
    server.addMiddleware(type, middleware.ensureLogin);
    server.addMiddleware(type, middleware.ensureSubscribed);
    server.addMiddleware(type, middleware.preprocessing);
}

/**
 * @Author: George_Chen
 * @Description: to configure the publish-out related middlewares
 *
 * @param {Object}        server, the socket server instance
 */
function _configPublishOut(server) {
    var middleware = require('./middlewares/publishOut');
    var type = server.MIDDLEWARE_PUBLISH_OUT;
    server.addMiddleware(type, middleware.filterSelf);
    server.addMiddleware(type, middleware.filterByUids);
    server.addMiddleware(type, middleware.sendToTarget);
}

/**
 * @Author: George_Chen
 * @Description: to configure the publish-out related middlewares
 *
 * @param {Object}        server, the socket server instance
 * @param {String}        from, the socket server instance
 * @param {Boolean}       isUserOnline, the socket server instance
 */
function _publishUserOnlineStatus(socket, from, isUserOnline) {
    socket.global.publish('activity:' + from, {
        clientHandler: 'updateFriendStatus',
        service: 'friend',
        params: {
            isOnline: isUserOnline,
            uid: from
        }
    });
}
