'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../sharedUtils/utils');
var DrawUtils = require('../../sharedUtils/drawUtils');
var Agent = require('../pgAgent');

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to save new drawing record
 *
 * @param {String}          channelId, channel id
 * @param {String}          _bid, the board uuid
 * @param {Array}           record, an array of drawing raw data
 * @param {Object}          drawOptions, current draw record options
 */
exports.saveAsync = function(channelId, _bid, record, drawOptions) {
    return Promise.all([
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(_bid, 'string'),
        DrawUtils.checkDrawRecordAsync(record),
        SharedUtils.argsCheckAsync(drawOptions, 'drawOptions')
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'INSERT INTO drawRecords("channelId", "_bid", record, "drawOptions") VALUES($1, $2, $3, $4)',
            values: queryParams
        };
        queryParams[2] = JSON.stringify(queryParams[2]);
        return Agent.execSqlAsync(sqlQuery);
    }).catch(function(err) {
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user find drawing records of the current channel board
 *
 * @param {String}          channelId, channel id
 * @param {String}          _bid, the board uuid
 */
exports.findByBoardAsync = function(channelId, _bid) {
    return Promise.all([
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(_bid, 'string')
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT * FROM drawRecords WHERE "channelId"=$1 AND "_bid"=$2 ' +
                'ORDER BY "drawTime" ASC',
            values: queryParams
        };
        return Agent.proxySqlAsync(sqlQuery);
    }).map(function(doc) {
        var time = doc.drawTime;
        doc.drawTime = (time instanceof Date ? time.getTime() : new Date(time).getTime());
        return doc;
    }).catch(function(err) {
        SharedUtils.printError('PgDrawRecord.js', 'findByBoardAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: archive number of documents on the current board
 *
 * @param {String}          channelId, channel id
 * @param {String}          _bid, the board uuid
 * @param {String}          number, set how many docs to be archived
 */
exports.archiveByNumberAsync = function(channelId, _bid, number) {
    return Promise.all([
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(_bid, 'string'),
        false, // isArchived=false for query
        true, // isArchived=true for update
        number // update number
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'UPDATE drawRecords ' +
                'SET "isArchived"=$4 ' +
                'WHERE id IN ( ' +
                'SELECT id FROM drawRecords ' +
                'WHERE "channelId"=$1 AND "_bid"=$2 AND "isArchived"=$3 ' +
                'ORDER BY "drawTime" ASC ' +
                'LIMIT $5)',
            values: queryParams
        };
        return Agent.execSqlAsync(sqlQuery);
    }).catch(function(err) {
        SharedUtils.printError('PgDrawRecord.js', 'ArchiveByNumberAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: undo the latest normal record of current channel board.
 *         NOTE: normal record means record without "archived" and "undo"
 *
 * @param {String}          channelId, channel id
 * @param {String}          _bid, the board uuid
 */
exports.setNewUndoAsync = function(channelId, _bid) {
    return Promise.all([
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(_bid, 'string'),
        false, // isUndo=false for query
        true // isUndo=true for update
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'UPDATE drawRecords ' +
                'SET "isUndo"=$4 ' +
                'WHERE id IN ( ' +
                'SELECT id FROM drawRecords ' +
                'WHERE "channelId"=$1 AND "_bid"=$2 AND "isUndo"=$3 ' +
                'ORDER BY "drawTime" DESC ' +
                'LIMIT 1)',
            values: queryParams
        };
        return Agent.execSqlAsync(sqlQuery);
    }).catch(function(err) {
        SharedUtils.printError('PgDrawRecord.js', 'setNewUndoAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: restore the undo status of oldest undo record 
 *               on current channel board
 *
 * @param {String}          channelId, channel id
 * @param {String}          _bid, the board uuid
 */
exports.restoreUndoAsync = function(channelId, _bid) {
    return Promise.all([
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(_bid, 'string'),
        true, // isUndo=true for query
        false // isUndo=false for update
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'UPDATE drawRecords ' +
                'SET "isUndo"=$4 ' +
                'WHERE id IN ( ' +
                'SELECT id FROM drawRecords ' +
                'WHERE "channelId"=$1 AND "_bid"=$2 AND "isUndo"=$3 ' +
                'ORDER BY "drawTime" ASC ' +
                'LIMIT 1)',
            values: queryParams
        };
        return Agent.execSqlAsync(sqlQuery);
    }).catch(function(err) {
        SharedUtils.printError('PgDrawRecord.js', 'setNewUndoAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to remove all archived records on current channel board
 *
 * @param {String}          channelId, channel id
 * @param {String}          _bid, the board uuid
 */
exports.removeArchivesAsync = function(channelId, _bid) {
    return Promise.all([
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(_bid, 'string'),
        true // isArchived=true for query
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'DELETE FROM drawRecords ' +
                'WHERE "channelId"=$1 AND "_bid"=$2 AND "isArchived"=$3',
            values: queryParams
        };
        return Agent.execSqlAsync(sqlQuery);
    }).catch(function(err) {
        SharedUtils.printError('PgDrawRecord.js', 'removeArchivesAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to remove all undo records on current channel board
 *
 * @param {String}          channelId, channel id
 * @param {String}          _bid, the board uuid
 */
exports.removeUndosAsync = function(channelId, _bid) {
    return Promise.all([
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(_bid, 'string'),
        true // isUndo=true for query
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'DELETE FROM drawRecords ' +
                'WHERE "channelId"=$1 AND "_bid"=$2 AND "isUndo"=$3',
            values: queryParams
        };
        return Agent.execSqlAsync(sqlQuery);
    }).catch(function(err) {
        SharedUtils.printError('PgDrawRecord.js', 'removeUndosAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to get the counts of actived draw records on current channel board
 *
 * @param {String}          channelId, channel id
 * @param {Number}          _bid, the board uuid
 */
exports.countActivedRecordsAsync = function(channelId, _bid) {
    return Promise.all([
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(_bid, 'string'),
        false // isUndo=true for query
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT CAST(COUNT(id) as INTEGER) FROM drawRecords ' +
                'WHERE "channelId"=$1 AND "_bid"=$2 AND "isArchived"=$3',
            values: queryParams
        };
        return Agent.proxySqlAsync(sqlQuery).then(function(result) {
            return result[0].count;
        });
    }).catch(function(err) {
        SharedUtils.printError('PgDrawRecord.js', 'countActivedRecordsAsync', err);
        throw err;
    });
};
