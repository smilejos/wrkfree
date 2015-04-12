'use strict';
var SocketCluster = require('sc2-client');

/**
 * initialize socket client
 * NOTE: socketCluster client will always try to recover 
 *       connection when socket is down.
 */
var Socket = SocketCluster.connect({
    secure: true,
    hostname: location.host + '/ws',
    port: 443
});

/**
 * secure socket after it initialized
 */
Socket.on('ready', function(state) {
    if (!state.isAuthenticated) {
        Socket.emit('auth', document.cookie, function(err) {
            // TODO:
            // error handling on "auth"
            if (err) {
                console.log(err);
            }
        });
    }
});

Socket.on('error', function() {
    // socket error handling
});

Socket.on('disconnect', function() {
    // disconnect handling
});

exports.getSocket = function() {
    return Socket;
};
