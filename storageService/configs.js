'use strict';
var Env = process.env.NODE_ENV || 'development';

/**
 * basic parameters
 */

var RedisDev = {
    host: '127.0.0.1',
    port: '6379',
    options: {},
    ttl: 3
};

var MongoDev = {
    host: 'mongodb://127.0.0.1:27017/',
    dbName: 'wrkfree'
};

/**
 * development and production configs
 * NOTE: currently production env is the same as devlopment
 */

var Configs = {};

Configs.development = {
    db: MongoDev.host + MongoDev.dbName,
    globalCacheEnv: RedisDev,
    localCacheEnv: RedisDev,
    cacheDbIndex: {
        chat: 1,
        drawing: 2,
        rtc: 3
    },
    dbEngine: 'mongodb',
    cacheEngine: 'redis'
};

Configs.production = {
    db: MongoDev.host + MongoDev.dbName,
    globalCacheEnv: RedisDev,
    localCacheEnv: RedisDev,
    cacheDbIndex: {
        chat: 1,
        drawing: 2,
        rtc: 3
    },
    dbEngine: 'mongodb',
    cacheEngine: 'redis'
};

/**
 * exports the configs based on current environment
 */
module.exports = Configs[Env];
