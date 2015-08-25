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
    var ChannelStorage = StorageManager.getService('Channel');

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
        if (uid) {
            return _disconnectChannel(uid, sid, subscriptions);
        }
    }

    /*
      In here we handle our incoming realtime connections and listen for events.
    */
    scServer.on('connection', function(socket) {
        LogUtils.info(LogCategory, null, 'socket [' + socket.id + '] connecting ...');
        var socketUid = socket.getAuthToken();
        if (socketUid) {
            LogUtils.info(LogCategory, {
                socketId: socket.id
            }, 'user [' + socketUid + '] enter ...');
            _publishUserOnlineStatus(UserStorage, socket, socketUid);
        }

        socket.on('message', function(data) {
            /**
             * socketCluster use "ping (1)" and "pong (2)" to detect socket alive
             * so we inform user online when getting "pong (2)" message
             */
            if (data === '2' && socket.getAuthToken()) {
                var uid = socket.getAuthToken();
                var subscriptions = socket.subscriptions();
                return Promise.all([
                    _visitSubscribedChannels(ChannelStorage, uid, subscriptions),
                    _publishUserOnlineStatus(UserStorage, socket, uid)
                ]).catch(function(err) {
                    LogUtils.warn(LogCategory, {
                        user: uid,
                        error: err.toString()
                    }, 'error in tracking user status ...');
                });
            }
        });

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
                    LogUtils.info(LogCategory, {
                        user: uid
                    }, 'socket [' + socket.id + '] get auth ...');
                    // configure uid as token
                    // TODO: should we use uid in cookie as token? is it secure ?
                    socket.setAuthToken(uid);
                    return _publishUserOnlineStatus(UserStorage, socket, uid);
                }
                LogUtils.warn(LogCategory, null, 'socket [' + socket.id + '] authentication fail');
                return callback('authentication fail');
            }).catch(function(err) {
                var errMsg = err.toString();
                LogUtils.error(LogCategory, {
                    cookie: cookieStr,
                    error: errMsg
                }, 'error in socket auth');
                throw errMsg;
            }).nodeify(callback);
        });

        socket.on('req', function(data, res) {
            LogUtils.debug(LogCategory, {
                reqData: data
            }, 'request from socket [' + socket.id + ']');
            return Dispatcher(socket, data)
                .then(function(result) {
                    return res(result.error, result.data);
                });
        });

        socket.on('disconnect', function() {
            LogUtils.info(LogCategory, {
                user: uid
            }, 'socket [' + socket.id + '] disconnect ...');
            var uid = socket.getAuthToken();
            var subscriptions = socket.subscriptions();
            return _userLeaveAsync(uid, socket.id, subscriptions)
                .catch(function(err) {
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
function _disconnectChannel(uid, socketId, subscriptions) {
    var rtcStorage = StorageManager.getService('Rtc');
    var channelStorage = StorageManager.getService('Channel');
    return Promise.map(subscriptions, function(subscription) {
        var info = subscription.split(':');
        if (info[0] === 'channel') {
            return Promise.all([
                channelStorage.removeVisitorAsync(uid, info[1]),
                rtcStorage.leaveSessionAsync(info[1], uid, socketId)
            ]);
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
    server.addMiddleware(type, middleware.ensureLogin);
    server.addMiddleware(type, middleware.vertifyArgument);
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
 * @param {String}        uid, the socket server instance
 */
function _publishUserOnlineStatus(userStorage, socket, uid) {
    LogUtils.debug(LogCategory, null, 'inform user [' + uid + '] online status');
    return userStorage.userEnterAsync(uid)
        .then(function(result) {
            if (result === null) {
                return LogUtils.warn(LogCategory, null, 'fail to set user [' + uid + '] online on storage service');
            }
            socket.global.publish('activity:' + uid, {
                clientHandler: 'updateOnlineFriend',
                service: 'friend',
                params: {
                    uid: uid
                }
            });
        });
}

/**
 * @Author: George_Chen
 * @Description: to update the channel visit information on each subscribed channel
 *
 * @param {Object}        channelStorage, the channel storage service instance
 * @param {String}        uid, the socket server instance
 * @param {Array}         subscriptions, an array of socket subscriptions
 */
function _visitSubscribedChannels(channelStorage, uid, subscriptions) {
    LogUtils.debug(LogCategory, null, 'update visited channel status of user [' + uid + ']');
    return Promise.map(subscriptions, function(target) {
        var info = target.split(':');
        if (info[0] === 'channel') {
            return channelStorage.keepVisistedAsync(uid, info[1]);
        }
    });
}
