'use strict';
var Cookie = require('cookie');
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

    /*
      In here we handle our incoming realtime connections and listen for events.
    */
    scServer.on('connection', function(socket) {
        var token = socket.getAuthToken();
        if (token) {
            UserStorage.userEnterAsync(token, socket.id);
        }

        socket.on('auth', function(cookie) {
            var uid = Cookie.parse(cookie).uid;
            // configure uid as token
            socket.setAuthToken(uid);
            return UserStorage.userEnterAsync(uid, socket.id);
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
 * @Description: to configure the handshake related middlewares
 *
 * @param {Object}        server, the socket server instance
 */
function _configSubscribe(server) {
    var middleware = require('./middlewares/subscribe');
    var type = server.MIDDLEWARE_SUBSCRIBE;
    server.addMiddleware(type, middleware.ensureAuthed);
}
