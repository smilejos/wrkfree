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
Configs.import('logs', require('../../configs/logs.json')[Env]);

var LogUtils = require('../../sharedUtils/logUtils');
var LogCategory = 'SOCKET';
LogUtils.init(Configs.get().logs);

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
    require('./services/drawWorker').setSocketWorker(worker);

    /**
     * @Author: George_Chen
     * @Description: for handling CTRL+C event
     */
    process.on('SIGINT', function() {
        _workerExit(scServer);
    });

    /**
     * @Author: George_Chen
     * @Description: this is used for catching signal sent by "docker stop"
     *         NOTE: on production environment, the docker stop will send this signal
     *               before force stop container
     */
    process.on('SIGTERM', function() {
        LogUtils.warn(LogCategory, {}, 'SYSTEM EVENT [SIGTERM] !');
        _workerReset();
    });

    /**
     * @Author: George_Chen
     * @Description: for handling fatal error on worker
     */
    worker.on('error', function() {
        LogUtils.error(LogCategory, {}, 'SYSTEM ERROR !');
        _workerReset();
    });

    /**
     * @Author: George_Chen
     * @Description: reset current worker
     */
    function _workerReset() {
        LogUtils.warn(LogCategory, {}, 'worker reset!');
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
        LogUtils.warn(LogCategory, {}, 'worker shutdown!');
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
        LogUtils.info(LogCategory, {
            socketId: sid
        }, 'user [' + uid + '] leave ...');
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
        LogUtils.info(LogCategory, null, 'socket [' + socket.id + '] connecting ...');
        var token = socket.getAuthToken();
        if (token) {
            LogUtils.info(LogCategory, {
                socketId: socket.id
            }, 'user [' + token + '] enter ...');
            UserStorage.userEnterAsync(token, socket.id)
                .then(function() {
                    return _publishUserOnlineStatus(socket, token, true);
                });
        }

        socket.on('auth', function(cookieStr, callback) {
            LogUtils.info(LogCategory, null, 'socket [' + socket.id + '] auth ...');
            return Promise.try(function() {
                var cookie = Cookie.parse(cookieStr);
                return [
                    cookie.uid,
                    middlewareUtils.isCookieSessionAuthAsync(cookie)
                ];
            }).spread(function(uid, isAuth) {
                if (isAuth) {
                    LogUtils.info(LogCategory, {user: uid}, 'socket [' + socket.id + '] get auth ...');
                    // configure uid as token
                    socket.setAuthToken(uid);
                    return UserStorage.userEnterAsync(uid, socket.id)
                        .then(function() {
                            return _publishUserOnlineStatus(socket, uid, true);
                        });
                }
                LogUtils.warn(LogCategory, null, 'socket [' + socket.id + '] authentication fail');
                throw new Error('authentication fail');
            }).catch(function(err) {
                var errMsg = err.toString();
                if (errMsg !== 'authentication fail') {
                    LogUtils.error(LogCategory, {
                        cookie: cookieStr,
                        error: err
                    }, 'error in socket auth');
                }
                throw errMsg;
            }).nodeify(callback);
        });

        socket.on('req', function(data, res) {
            LogUtils.debug(LogCategory, {reqData: data}, 'request from socket [' + socket.id + ']');
            return Dispatcher(socket, data)
                .then(function(result) {
                    return res(result.error, result.data);
                });
        });

        socket.on('disconnect', function() {
            LogUtils.info(LogCategory, {user: uid}, 'socket [' + socket.id + '] disconnect ...');
            var uid = socket.getAuthToken();
            var subscriptions = socket.subscriptions();
            return _userLeaveAsync(uid, socket.id, subscriptions)
                .then(function(isUserLeft) {
                    if (isUserLeft === 1) {
                        return _publishUserOnlineStatus(socket, uid, false);
                    }
                }).catch(function(err) {
                    LogUtils.error(LogCategory, {
                        user: uid,
                        error: err
                    }, 'error in socket disconnect ...');
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
    LogUtils.info(LogCategory, {online: isUserOnline}, 'inform user ['+from+'] status');
    socket.global.publish('activity:' + from, {
        clientHandler: 'updateFriendStatus',
        service: 'friend',
        params: {
            isOnline: isUserOnline,
            uid: from
        }
    });
}
