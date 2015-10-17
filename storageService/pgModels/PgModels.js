'use strict';
var Env = process.env.NODE_ENV || 'development';
var Pg = require('pg');
var Promise = require('bluebird');
var DbConfigs = require('../../configs/db.json')[Env];

// setup PostgresSQL default parameters
Pg.defaults.user = DbConfigs.pgEnv.user;
Pg.defaults.password = DbConfigs.pgEnv.password;
Pg.defaults.database = DbConfigs.pgEnv.database;
Pg.defaults.host = DbConfigs.pgEnv.host;
Pg.defaults.port = DbConfigs.pgEnv.port;

Promise.promisifyAll(Pg);

/**
 * Public API
 * @Author: George_Chen
 * @Description: for creating drawRecords table
 */
exports.createDrawRecordsAsync = function() {
    return Pg.connectAsync().spread(function(client, done) {
        return client.queryAsync('CREATE TABLE drawRecords( ' +
                'id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ' +
                '_bid uuid, ' +
                '"channelId" VARCHAR(32), ' +
                '"isUndo" boolean DEFAULT false, ' +
                '"isArchived" boolean DEFAULT false, ' +
                '"record" jsonb, ' +
                '"drawOptions" json, ' +
                '"drawTime" timestamp DEFAULT CURRENT_TIMESTAMP)')
            .then(function(result) {
                console.log('[INFO] createDrawRecordsAsync result ', result);
                done();
            }).catch(function(err) {
                console.log('[ERROR] on query createDrawRecordsAsync ', err);
            });
    }).catch(function(err) {
        console.log('[ERROR] on createDrawRecordsAsync ', err);
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for creating drawboards table
 */
exports.createDrawBoardsAsync = function() {
    return Pg.connectAsync().spread(function(client, done) {
        return client.queryAsync('CREATE TABLE drawBoards( ' +
                'id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ' +
                '"channelId" VARCHAR(32), ' +
                '"base" TEXT , ' +
                '"preview" TEXT , ' +
                '"background" TEXT , ' +
                '"createdTime" timestamp DEFAULT CURRENT_TIMESTAMP, ' +
                '"updatedTime" timestamp DEFAULT CURRENT_TIMESTAMP)')
            .then(function(result) {
                console.log('[INFO] createDrawBoardsAsync result ', result);
                done();
            }).catch(function(err) {
                console.log('[ERROR] on query createDrawBoardsAsync ', err);
            });
    }).catch(function(err) {
        console.log('[ERROR] on createDrawBoardsAsync ', err);
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for creating friends table
 */
exports.createFriendsAsync = function() {
    return Pg.connectAsync().spread(function(client, done) {
        return client.queryAsync('CREATE TABLE friends( ' +
                'id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ' +
                'owner VARCHAR(32), ' +
                'uid VARCHAR(32), ' +
                '"group" TEXT )')
            .then(function(result) {
                console.log('[INFO] createFriendsAsync result ', result);
                done();
            }).catch(function(err) {
                console.log('[ERROR] on query createFriendsAsync ', err);
            });
    }).catch(function(err) {
        console.log('[ERROR] on createFriendsAsync ', err);
    });
};
