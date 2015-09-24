'use strict';
var Pg = require('pg');
var Promise = require('bluebird');
var EventEmitter = require('events').EventEmitter;
var CryptoUtils = require('../sharedUtils/cryptoUtils');

// for recording running queries
var RuningQueries = {};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to do a simple sql query
 *         NOTE: usually for operation: 'create', 'update' and 'delete'
 *
 * @param {Object}      queryObject, the formatted pg query object
 */
exports.execSqlAsync = function(queryObject) {
    return Pg.connectAsync().spread(function(client, done) {
        return client.queryAsync(queryObject)
            .then(function(result) {
                done();
                return result.rows;
            }).catch(function(err) {
                done();
                throw err;
            });
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to proxy the same sql query request if the same query has been running
 *         NOTE: usually for operation: 'get'; 
 *               e.g. concurrent get user info requests can be served as a single sql query
 * 
 * @param {Object}      queryObject, the formatted pg query object
 * @param {Function}    callback, this callback function is for promise internal used
 */
exports.proxySqlAsync = Promise.promisify(function(queryObject, callback) {
    var queryHash = CryptoUtils.getMd5Hex(JSON.stringify(queryObject));
    var pgQuery = RuningQueries[queryHash];
    if (pgQuery) {
        return pgQuery.once('result', function(result) {
            return callback(null, result);
        });
    }
    pgQuery = RuningQueries[queryHash] = new EventEmitter();
    pgQuery.once('result', function(result) {
        callback(null, result);
    });
    pgQuery.once('end', function() {
        _clearQuery(queryHash);
    });
    pgQuery.once('error', function(err) {
        _clearQuery(queryHash);
        callback(err);
    });
    return Pg.connectAsync().spread(function(client, done) {
        return client.queryAsync(queryObject)
            .then(function(result) {
                done();
                pgQuery.emit('result', result.rows);
                pgQuery.emit('end');
            }).catch(function(err) {
                done();
                pgQuery.emit('error', err);
            });
    }).catch(function(err) {
        pgQuery.emit('error', err);
    });
});

/**
 * @Author: George_Chen
 * @Description: used to clear running query objects
 */
function _clearQuery(rawString) {
    if (RuningQueries[rawString]) {
        delete RuningQueries[rawString];
    }
}
