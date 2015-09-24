'use strict';
var Env = process.env.NODE_ENV || 'development';
var Pg = require('pg');
var PgClient = Pg.Client;
var Promise = require('bluebird');
var Mongoose = require('mongoose');
var DbConfigs = require('../configs/db.json')[Env];
var PgEnv = DbConfigs.pgEnv;

Promise.promisifyAll(Mongoose);
Promise.promisifyAll(Pg);

/**
 * Public API
 * @Author: George_Chen
 * @Description: migrating drawRecords collection to postgresSQL table 
 */
exports.drawRecordsMigration = function() {
    function _getDrawRecordQuery(doc) {
        return {
            text: 'INSERT INTO drawRecords("channelId", "boardId",  "isUndo", "isArchived", record, "drawOptions", "drawTime") ' +
                'VALUES($1, $2, $3, $4, $5, $6, $7)',
            values: [doc.channelId, doc.boardId, doc.isUndo, doc.isArchived, JSON.stringify(doc.record), doc.drawOptions, doc.drawTime]
        };
    }
    return _MongoConnect().then(function() {
        require('./models/DrawRecordModel');
        var model = Mongoose.model('DrawRecord');
        return _tableMigration(model, _getDrawRecordQuery);
    });
};

/**
 * @Author: George_Chen
 * @Description: migrdate mongodb collection to postgresSQL table
 *
 * @param {Object}      mongoModel, the mongoose model
 * @param {Function}    sqlQueryHandler, handler for generating table dependent sql query
 */
function _tableMigration(mongoModel, sqlQueryHandler) {
    var pgClient = new PgClient(PgEnv);
    pgClient.connect();
    return mongoModel.findAsync({}).then(function(results) {
        console.log('[INFO] migration documents counts: ', results.length);
        return Promise.map(results, function(doc) {
            var sqlQuery = sqlQueryHandler(doc);
            return pgClient.queryAsync(sqlQuery);
        });
    }).then(function(migratedResults) {
        console.log('[INFO] migration documents result counts: ', migratedResults.length);
        pgClient.end();
    }).catch(function(err) {
        console.log('[ERROR] migration documents fail', err);
    });
}

/**
 * @Author: George_Chen
 * @Description: used to connect mongoDB
 */
function _MongoConnect() {
    var targetDb = DbConfigs.dbEnv.host + DbConfigs.dbEnv.dbName;
    // connect to mongodb
    return Mongoose.connectAsync(targetDb, {
        server: {
            socketOptions: {
                keepAlive: 1
            }
        }
    });
}
