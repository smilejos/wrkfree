'use strict';
var SocketCluster = require('socketcluster').SocketCluster;
var Promise = require('bluebird');
var Workers = [];

var socketCluster = new SocketCluster({
    workers: 1, // Number of worker processes
    stores: 1, // Number of store processes
    port: 3050, // The port number on which your server should listen
    appName: 'wrkfreeSocket', // A unique name for your app

    /* A JS file which you can use to configure each of your 
     * workers/servers - This is where most of your backend code should go
     */
    workerController: __dirname + '/worker/worker.js',

    /* JS file which you can use to configure each of your 
     * stores - Useful for scaling horizontally across multiple machines (optional)
     * 
     * NOTE: currently we are not ready to implment this.
     */
    // storeController: __dirname + '/store/store.js',
    // storeOptions: {
    //     host: '127.0.0.1',
    //     port: 6379
    // },

    /* Maximum number of events a single socket can be subscribed to 
     * (security feature, optional, defaults to 100)
     */
    socketEventLimit: 100,

    rebootOnSignal: false,

    // Whether or not to reboot the worker in case it crashes (defaults to true)
    rebootWorkerOnCrash: true
});

socketCluster.on('workerStart', function(workerInfo){
    Workers.push(workerInfo.pid);
});
