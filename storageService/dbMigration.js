'use strict';
var Env = process.env.NODE_ENV || 'development';
var Pg = require('pg');
var Fs = require('fs');
var PgClient = Pg.Client;
var Promise = require('bluebird');
var Mongoose = require('mongoose');
var DbConfigs = require('../configs/db.json')[Env];
var PgEnv = DbConfigs.pgEnv;
var PgModel = require('./pgModels/PgModels');

Promise.promisifyAll(Mongoose);
Promise.promisifyAll(Pg);
Promise.promisifyAll(Fs);

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
 * Public API
 * @Author: George_Chen
 * @Description: migrating drawboards and drawpreviews collection to postgresSQL table 
 */
exports.drawBoardsMigration = function() {
    var pgClient = new PgClient(PgEnv);
    var channelPath;
    pgClient.connect();
    require('./models/DrawBoardModel');
    require('./models/DrawPreviewModel');
    var boardModel = Mongoose.model('DrawBoard');
    var previewModel = Mongoose.model('DrawPreview');
    return pgClient.queryAsync({
        text: 'SELECT EXISTS (' +
            'SELECT 1 ' +
            'FROM   information_schema.tables ' +
            'WHERE  table_schema = $1' +
            'AND    table_name = $2 )',
        values: ['public', 'drawboards']
    }).then(function(tableResult) {
        var tableExist = tableResult.rows[0].exists;
        if (!tableExist) {
            return PgModel.createDrawBoardsAsync();
        }
    }).then(function() {
        return _MongoConnect().then(function() {
            return boardModel.findAsync();
        }).each(function(doc) {
            channelPath = '/data/files/' + doc.channelId + '/';
            return Promise.try(function() {
                if (!Fs.existsSync(channelPath)) {
                    return Fs.mkdirAsync(channelPath);
                }
            }).then(function() {
                var sqlQuery = {
                    text: 'INSERT INTO drawBoards("channelId", "boardId",  "createdTime", "updatedTime") ' +
                        'VALUES($1, $2, $3, $4)',
                    values: [doc.channelId, doc.boardId, doc._id.getTimestamp(), doc.updatedTime]
                };
                return pgClient.queryAsync(sqlQuery).then(function() {
                    return pgClient.queryAsync({
                        text: 'SELECT id FROM drawBoards ' +
                            'WHERE "channelId"=$1 AND "boardId"=$2',
                        values: [doc.channelId, doc.boardId]
                    });
                }).then(function(result) {
                    var bid = result.rows[0].id;
                    var basePath = channelPath + bid + '_base.png';
                    var previewPath = channelPath + bid + '_preview.png';
                    return previewModel.findOneAsync({
                        channelId: doc.channelId,
                        boardId: doc.boardId
                    }).then(function(previewDoc) {
                        return Promise.join(
                            Fs.writeFileAsync(basePath, doc.baseImg.chunks),
                            Fs.writeFileAsync(previewPath, previewDoc.chunks),
                            function() {
                                return pgClient.queryAsync({
                                    text: 'UPDATE drawBoards set base=$1, preview=$2 WHERE id=$3',
                                    values: [basePath, previewPath, bid]
                                });
                            });
                    });
                });
            }).catch(function(err) {
                console.log('[ERROR] fail to dump image ', doc, err);
                throw err;
            });
        });
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
