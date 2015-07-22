var express = require('express');
var server = express();
var port = process.env.PORT || 3000;
var Env = process.env.NODE_ENV || 'development';

/**
 * setup configurations for web server
 */
var Configs = require('../../configs/config');
Configs.import('params', require('../../configs/parameters.json'));
Configs.import('db', require('../../configs/db.json')[Env]);
Configs.import('logs', require('../../configs/logs.json')[Env]);

var LogUtils = require('../../sharedUtils/logUtils');
var LogCategory = 'WEB';
LogUtils.init(Configs.get().logs);

// needed when we get the ".jsx" files
require('node-jsx').install({
    extension: '.jsx'
});

// require the fluxible app
var App = require('../shared/app');

var StorageDir = '../../storageService/';
var StorageManager = require(StorageDir + 'storageManager');
StorageManager.connectDb();

/**
 * Configurations
 */
require('./configs/passport')();
require('./configs/express')(server);
require('./configs/routes')(server);

server.listen(port);

LogUtils.info(LogCategory, {listenPort: port}, 'web server start !');

/**
 * send an signal to gulp dev server to trigger livereload
 */
if (Env === 'development') {
    var devPort = 9999;
    require('net').connect(devPort);
}
