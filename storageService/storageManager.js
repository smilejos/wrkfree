'use strict';
var Mongoose = require('mongoose');
var Promise = require('bluebird');
var Redis = require('redis');
var Fs = require('fs');
var MongooseCache = require('mongoose-cache-manager');

/**
 * storage services that has been implemented
 */
 var Services = [
     'UserService',
     'FriendService',
     'ChannelService'
 ];

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

var StorageManager = {};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to get the specific storage service
 *
 * @param {String}      serviceType, the storage service type
 */
StorageManager.getService = function(serviceType) {
    var ServiceName = serviceType + 'Service';
    if (Services.indexOf(ServiceName) === -1) {
        return false;
    }
    return require('./services/' + ServiceName);
};

module.exports = function(configs) {
    _mongooseInit(configs);
    _cacheInit(configs);
    _promisify();
    return StorageManager;
};

/************************************************
 *
 *           internal functions
 *
 ************************************************/

/**
 * @Author: George_Chen
 * @Description: to init the mongoose module
 * NOTE: implemented by Norman_Huang, modified by George_Chen
 *
 * @param {Object}      configs, the storage configs object
 *                      (ref: ".../storageService/configs.js")
 */
function _mongooseInit(configs) {
    var modelsPath = __dirname + '/models';
    // connect to mongodb
    var connect = function() {
        var options = {
            server: {
                socketOptions: {
                    keepAlive: 1
                }
            }
        };
        Mongoose.connect(configs.db, options);
    };
    connect();
    // reconnect Error handler
    Mongoose.connection.on('error', function(err) {
        console.log(err);
    });
    // reconnect when closed
    Mongoose.connection.on('disconnected', function() {
        connect();
    });
    // load models
    Fs.readdirSync(modelsPath).forEach(function(file) {
        if (~file.indexOf('.js')) {
            require(modelsPath + '/' + file);
        }
    });
}

/**
 * @Author: George_Chen
 * @Description: initialize the mongoose cache environment
 *
 * @param {Object}      configs, the storage configs object
 *                      (ref: ".../storageService/configs.js")
 */
function _cacheInit(configs) {
    var cacheEnv = configs.cacheDbType + 'CacheEnv';
    MongooseCache(Mongoose, {
        host: configs[cacheEnv].host,
        port: configs[cacheEnv].port,
        ttl: configs[cacheEnv].ttl,
        store: configs.cacheEngine
    });
}

/**
 * @Author: George_Chen
 * @Description: promisify the related modules
 */
function _promisify() {
    Promise.promisifyAll(Mongoose);
    Promise.promisifyAll(Redis.RedisClient.prototype);
    Promise.promisifyAll(Redis.Multi.prototype);
}
