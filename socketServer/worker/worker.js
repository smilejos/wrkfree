'use strict';

module.exports.run = function(worker) {

    // Get a reference to our realtime SocketCluster server
    var scServer = worker.getSCServer();

    /*
      In here we handle our incoming realtime connections and listen for events.
    */
    scServer.on('connection', function(socket) {

        socket.on('disconnect', function() {
            // do something
        });
    });
};
