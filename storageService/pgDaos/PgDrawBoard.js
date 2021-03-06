'use strict';
var Fs = require('fs');
var Promise = require('bluebird');
var Agent = require('../pgAgent');
var SharedUtils = require('../../sharedUtils/utils');
var LogUtils = require('../../sharedUtils/logUtils');
var LogCategory = 'STORAGE';

var ImageTypes = ['base', 'preview', 'background'];

Promise.promisifyAll(Fs);

/**
 * Public API
 * @Author: George_Chen
 * @Description: create draw board docuemnt of the current channel
 *
 * @param {String}          channelId, channel id
 */
exports.saveAsync = function(channelId) {
    return Promise.all([
        SharedUtils.argsCheckAsync(channelId, 'md5')
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'INSERT INTO drawBoards("channelId") VALUES($1)',
            values: queryParams
        };
        return Agent.execSqlAsync(sqlQuery);
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            args: SharedUtils.getArgs(arguments),
            error: err.toString()
        }, 'error in PgDrawBoard.saveAsync()');
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: find board uuid by its index
 *
 * @param {String}          channelId, the channel id
 * @param {Number}          boardIdx, the board index
 */
exports.findIdByIdxAsync = function(channelId, boardIdx) {
    return Promise.all([
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(boardIdx, 'number')
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT id FROM drawBoards WHERE "channelId"=$1 ORDER BY "createdTime" LIMIT 1 OFFSET $2',
            values: queryParams
        };
        return Agent.proxySqlAsync(sqlQuery).then(function(result) {
            return result[0].id;
        });
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            args: SharedUtils.getArgs(arguments),
            error: err.toString()
        }, 'error in PgDrawBoard.findIdAsync()');
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: find board image by the board uuid
 *
 * @param {String}          _bid, board uuid
 * @param {String}          imgType, the type of querying image
 */
exports.findImgByIdAsync = function(channelId, _bid, imgType) {
    return Promise.all([
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(_bid, 'string')
    ]).then(function(queryParams) {
        if (!_isImgTypeValid(imgType)) {
            throw new Error('query on not supported img type');
        }
        var sqlQuery = {
            text: 'SELECT * FROM drawBoards WHERE "channelId"=$1 AND id=$2',
            values: queryParams
        };
        return Agent.proxySqlAsync(sqlQuery).then(function(result) {
            var data = result[0];
            return Promise.props({
                bid: data.id,
                channelId: data.channelId,
                content: (data[imgType] ? Fs.readFileAsync(data[imgType]) : new Buffer(''))
            });
        });
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            args: SharedUtils.getArgs(arguments),
            error: err.toString()
        }, 'error in PgDrawBoard.findImgByIdAsync()');
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: find board image by the board index (channelId + boardIdx)
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardIdx, the draw board id
 * @param {String}          imgType, the type of querying image
 */
exports.findImgByIndexAsync = function(channelId, boardIdx, imgType) {
    return Promise.all([
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(boardIdx, 'number')
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT * FROM drawBoards WHERE "channelId"=$1 ORDER BY "createdTime" LIMIT 1 OFFSET $2',
            values: queryParams
        };
        if (!_isImgTypeValid(imgType)) {
            throw new Error('query on not supported img type');
        }
        return Agent.proxySqlAsync(sqlQuery).then(function(result) {
            var data = result[0];
            return Promise.props({
                bid: data.id,
                channelId: data.channelId,
                content: (data[imgType] ? Fs.readFileAsync(data[imgType]) : new Buffer(''))
            });
        });
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            args: SharedUtils.getArgs(arguments),
            error: err.toString()
        }, 'error in PgDrawBoard.findImgByIndexAsync()');
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: find the latest updated board info on current channel
 *
 * @param {String}          channelId, channel id
 */
exports.findByLatestUpdatedAsync = function(channelId) {
    return Promise.all([
        SharedUtils.argsCheckAsync(channelId, 'md5')
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT *, CAST(RANK() OVER (ORDER BY "createdTime") -1 AS integer) idx ' +
                'FROM drawBoards WHERE "channelId"=$1 ' +
                'ORDER BY "updatedTime" DESC LIMIT 1',
            values: queryParams
        };
        return Agent.proxySqlAsync(sqlQuery).then(function(result) {
            return result[0];
        });
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            args: SharedUtils.getArgs(arguments),
            error: err.toString()
        }, 'error in PgDrawBoard.findByLatestUpdatedAsync()');
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: find the latest updated image on current channel
 *
 * @param {String}          channelId, channel id
 * @param {String}          imgType, the type of querying image
 */
exports.findImgByLatestUpdatedAsync = function(channelId, imgType) {
    if (!_isImgTypeValid(imgType)) {
        throw new Error('query on not supported img type');
    }
    return exports.findByLatestUpdatedAsync(channelId)
        .then(function(data) {
            return Promise.props({
                bid: data.id,
                channelId: data.channelId,
                content: (data[imgType] ? Fs.readFileAsync(data[imgType]) : new Buffer(''))
            });
        }).catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in PgDrawBoard.findImgByLatestUpdatedAsync()');
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: update the new image to filesystem and db
 *
 * @param {String}          channelId, channel id
 * @param {String}          bid, board uuid
 * @param {String}          imgType, the type of querying image
 * @param {Buffer}          content, the image content buffer
 */
exports.updateImgAsync = function(channelId, bid, imgType, content) {
    return Promise.join(
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(bid, 'string'),
        function(cid, _bid) {
            if (!_isImgTypeValid(imgType)) {
                throw new Error('query on not supported img type');
            }
            var channelPath = '/data/files/' + cid + '/';
            var filePath = channelPath + _bid + '_' + imgType + '.png';
            return Promise.try(function() {
                if (!Fs.existsSync(channelPath)) {
                    return Fs.mkdirAsync(channelPath);
                }
            }).then(function(){
                return Fs.writeFileAsync(filePath, content);
            }).then(function(){
                var sqlQuery = {
                    text: 'UPDATE drawBoards set "' + imgType + '"=$1, "updatedTime"=$2 WHERE id=$3',
                    values: [filePath, new Date(), _bid]
                };
                return Agent.execSqlAsync(sqlQuery);
            });
        }).catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in PgDrawBoard.updateImgAsync()');
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to count active boards on current channel
 *
 * @param {String}          channelId, channel id
 */
exports.countBoardsAsync = function(channelId) {
    return Promise.all([
        SharedUtils.argsCheckAsync(channelId, 'md5')
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT CAST(COUNT(id) as INTEGER) FROM drawBoards WHERE "channelId"=$1',
            values: queryParams
        };
        return Agent.proxySqlAsync(sqlQuery).then(function(result) {
            return result[0].count;
        });
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            args: SharedUtils.getArgs(arguments),
            error: err.toString()
        }, 'error in PgDrawBoard.countBoardsAsync()');
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: delete specific draw board related data
 *         TODO: we should also remove related images
 *
 * @param {String}          channelId, channel id
 * @param {String}          bid, board uuid
 */
exports.deleteAsync = function(channelId, bid) {
    return Promise.all([
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(bid, 'string')
    ]).then(function(queryParams) {
        return Agent.execTransactionAsync([{
            text: 'DELETE FROM drawBoards WHERE "channelId"=$1 AND "id"=$2',
            values: queryParams
        }, {
            text: 'DELETE FROM drawRecords WHERE "channelId"=$1 AND "_bid"=$2',
            values: queryParams
        }]);
    }).then(function() {
        var pathPrefix = '/data/files/' + channelId + '/' + bid;
        return Promise.map(ImageTypes, function(type) {
            var file = pathPrefix + '_' + type + '.png';
            return Fs.unlinkAsync(file).catch(function() {
                return null;
            });
        });
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            args: SharedUtils.getArgs(arguments),
            error: err.toString()
        }, 'error in PgDrawBoard.deleteAsync()');
        throw err;
    });
};

/**
 * @Author: George_Chen
 * @Description: to check image type is supported or not
 *
 * @param {String}          type, the type of supported image
 */
function _isImgTypeValid(type) {
    return (ImageTypes.indexOf(type) !== -1);
}
