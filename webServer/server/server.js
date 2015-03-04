var express = require('express');
var server = express();
var port = process.env.PORT || 3000;

// needed when we get the ".jsx" files
require('node-jsx').install({
    extension: '.jsx'
});

// require the fluxible app
var App = require('../shared/app');

/**
 * App Env setup on server
 */
var storePlugin = App.getPlugin('storePlugin');
storePlugin.envSetup({
    lokijs: require('lokijs')
});


var StorageDir = '../../storageService/';
var StorageManager = require(StorageDir + 'storageManager')(require(StorageDir + 'configs'));

/**
 * Configurations
 */
require('./configs/passport')();
require('./configs/express')(server);
require('./configs/routes')(server, StorageManager);

server.listen(port);
console.log('Listening on port ' + port);
