'use strict';
var Pg = require('pg');
var Mongoose = require('mongoose');
var Promise = require('bluebird');
var Redis = require('redis');
var Fs = require('fs');
var SharedUtils = require('../sharedUtils/utils');
var MongooseCache = require('mongoose-cache-manager');
var Configs = require('../configs/config');
var DbConfigs = Configs.get().db;
if (!DbConfigs) {
    throw new Error('DB configurations broken');
}

var ModelsPath = __dirname + '/' + 'models';

/**
 * flag used to check db is connected or not
 */
var isDbConnected = false;

/**
 * storage services that has been implemented
 * NOTE: every implemented service should add index here
 */
var Services = [
    'UserService',
    'FriendService',
    'ChannelService',
    'MsgService',
    'DrawService',
    'ReqRespService',
    'RtcService',
    'SearchService'
];

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: to get the specific storage service
 *
 * @param {String}      serviceType, the storage service type
 */
exports.getService = function(serviceType) {
    var ServiceName = serviceType + 'Service';
    if (!isDbConnected) {
        return SharedUtils.printError(
            'storageManager.js',
            'getService',
            new Error('db not connected')
        );
    }
    if (Services.indexOf(ServiceName) === -1) {
        return SharedUtils.printError(
            'storageManager.js',
            'getService',
            new Error('service type error')
        );
    }
    return require('./services/' + ServiceName);
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to connect db and cache server
 * NOTE: just like "mongoose.connect()"
 */
exports.connectDb = function() {
    if (isDbConnected) {
        return SharedUtils.printError(
            'storageManager.js',
            'connectDb',
            new Error('db already connected')
        );
    }
    // setup PostgresSQL default parameters
    Pg.defaults.user = DbConfigs.pgEnv.user;
    Pg.defaults.password = DbConfigs.pgEnv.password;
    Pg.defaults.database = DbConfigs.pgEnv.database;
    Pg.defaults.host = DbConfigs.pgEnv.host;
    Pg.defaults.port = DbConfigs.pgEnv.port;

    // connect to mongoDB
    _MongoConnect();

    // reconnect Error handler
    Mongoose.connection.on('error', function(err) {
        SharedUtils.printError('storageManager.js', 'connectDb', err);
    });

    // reconnect when closed
    Mongoose.connection.on('disconnected', function() {
        _MongoConnect();
    });

    // load models
    Fs.readdirSync(ModelsPath).forEach(function(file) {
        if (~file.indexOf('.js')) {
            require(ModelsPath + '/' + file);
        }
    });

    // configure mongoose cache
    MongooseCache(Mongoose, {
        host: DbConfigs.cacheEnv.global.host,
        port: DbConfigs.cacheEnv.global.port,
        options: DbConfigs.cacheEnv.global.options,
        ttl: DbConfigs.cacheEnv.global.ttl,
        store: DbConfigs.cacheEngine
    });

    // promisify storage libs
    Promise.promisifyAll(Pg);
    Promise.promisifyAll(Mongoose);
    Promise.promisifyAll(Redis.RedisClient.prototype);
    Promise.promisifyAll(Redis.Multi.prototype);

    isDbConnected = true;
};

/**
 * @Author: George_Chen
 * @Description: used to connect mongoDB
 */
function _MongoConnect() {
    var targetDb = DbConfigs.dbEnv.host + DbConfigs.dbEnv.dbName;
    // connect to mongodb
    return Mongoose.connect(targetDb, {
        server: {
            socketOptions: {
                keepAlive: 1
            }
        }
    });
}
