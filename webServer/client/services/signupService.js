'use strict';
var SocketManager = require('./socketManager');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: used to initiate the websocket
 */
exports.initSocketAsync = function() {
    return new Promise(function(resolver, rejecter) {
        SocketManager.init(function(err) {
            return (err ? rejecter(err) : resolver(true));
        });
    });
};
