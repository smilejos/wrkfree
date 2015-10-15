'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var StorageManager = require('../../../storageService/storageManager');
var DrawStorage = StorageManager.getService('Draw');
var DrawWorker = require('../services/drawWorker');
var DrawUtils = require('../../../sharedUtils/drawUtils');
var LogUtils = require('../../../sharedUtils/logUtils');
var LogCategory = 'HANDLER';

/**
 * Public API
 * @Author: George_Chen
 * @Description: for handling realtime drawing chunks that user published
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {String}          data._bid, the board uuid
 * @param {Array}           data.chunks, the raw chunks of current drawing
 */
exports.drawAsync = function(socket, data) {
    return Promise.try(function() {
        var isCid = SharedUtils.isMd5Hex(data.channelId);
        var isBid = SharedUtils.isString(data._bid);
        var chunks = DrawUtils.checkDrawChunksAsync(data.chunks);
        if (!isCid || !isBid || !chunks) {
            throw new Error('abnormal draws');
        }
    }).catch(function(err) {
        LogUtils.warn(LogCategory, {
            reqData: data,
            error: err.toString()
        }, '[' + socket.id + '] fail on drawAsync');
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: drawer should send this event to inform server that
 *               he already findish his current draw.
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {String}          data._bid, the board uuid
 * @param {Number}          data.chunksNum, how many chunks that drawer sent
 * @param {Object}          data.drawOptions, the draw options for this record
 */
exports.saveRecordAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    LogUtils.info(LogCategory, {
        uid: uid,
        channelId: data.channelId,
        bid: data._bid
    }, '[' + socket.id + '] save draw record... ');
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data._bid, 'string'),
        DrawUtils.checkDrawRecordAsync(data.record),
        SharedUtils.argsCheckAsync(data.drawOptions, 'drawOptions'),
        function(cid, _bid, record, drawOptions) {
            return DrawStorage.saveRecordAsync(cid, _bid, record, drawOptions);
        }).then(function(result) {
            if (result === null) {
                throw new Error('save draw record fail on storage service');
            }
            // enqueue a preview image update job
            DrawWorker.setUpdateSchedule(data.channelId, data._bid, uid);
            return result;
        }).catch(function(err) {
            LogUtils.warn(LogCategory, {
                reqData: data,
                error: err.toString()
            }, '[' + socket.id + '] fail on saveRecordAsync');
            // inform other members the latest draw saving failure
            if (SharedUtils.isMd5Hex(data.channelId) && SharedUtils.isString(data._bid)) {
                _publishDrawFail(socket, data.channelId, data._bid, 'save draw fail');
            }
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: user can use this function to trigger clean on current board
 * 
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {String}          data._bid, the board uuid
 */
exports.cleanDrawBoardAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    LogUtils.info(LogCategory, {
        uid: uid,
        channelId: data.channelId,
        bid: data._bid
    }, '[' + socket.id + '] clean current board... ');

    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data._bid, 'string'),
        function(cid, bid) {
            return DrawStorage.cleanBoardAsync(cid, bid);
        }).then(function(result) {
            if (result === null) {
                throw new Error('fail to clean drawboard');
            }
            DrawWorker.setUpdateSchedule(data.channelId, data._bid, uid);
            return result;
        }).catch(function(err) {
            LogUtils.warn(LogCategory, {
                reqData: data,
                error: err.toString()
            }, '[' + socket.id + '] fail on cleanDrawBoardAsync');
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to add new drawing boards
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {Number}          data.boardIdx, the new board index
 */
exports.addBoardAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    LogUtils.info(LogCategory, {
        uid: uid,
        channelId: data.channelId,
        boardIdx: data.newBoardIdx
    }, '[' + socket.id + '] add new drawing board ');
    return SharedUtils.argsCheckAsync(data.channelId, 'md5')
        .then(function(cid) {
            return DrawStorage.addBoardAsync(cid, uid);
        }).then(function(result) {
            var errMsg = 'add new draw board fail';
            return SharedUtils.checkExecuteResult(result, errMsg);
        }).catch(function(err) {
            LogUtils.warn(LogCategory, {
                reqData: data,
                error: err.toString()
            }, '[' + socket.id + '] fail on addBoardAsync');
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to undo the draw record on current board
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {String}          data._bid, the board uuid
 */
exports.drawUndoAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    LogUtils.info(LogCategory, {
        uid: uid,
        channelId: data.channelId,
        bid: data._bid
    }, '[' + socket.id + '] try to undo last draw... ');
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data._bid, 'string'),
        function(cid, bid) {
            return DrawStorage.undoRecordAsync(cid, bid, uid);
        }).then(function(result) {
            if (result === null) {
                throw new Error('fail to undo last draw on storage service');
            }
            DrawWorker.setUpdateSchedule(data.channelId, data._bid, uid);
            return result;
        }).catch(function(err) {
            LogUtils.warn(LogCategory, {
                reqData: data,
                error: err.toString()
            }, '[' + socket.id + '] fail on drawUndoAsync');
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to redo the draw record on current board
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {String}          data._bid, the board uuid
 */
exports.drawRedoAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    LogUtils.info(LogCategory, {
        uid: uid,
        channelId: data.channelId,
        bid: data._bid
    }, '[' + socket.id + '] try to restore last undo draw... ');
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data._bid, 'string'),
        function(cid, bid) {
            return DrawStorage.restoreUndoAsync(cid, bid, uid);
        }).then(function(result) {
            if (result === null) {
                throw new Error('fail to restore last undo draw on storage service');
            }
            DrawWorker.setUpdateSchedule(data.channelId, data._bid, uid);
            return result;
        }).catch(function(err) {
            LogUtils.warn(LogCategory, {
                reqData: data,
                error: err.toString()
            }, '[' + socket.id + '] fail on drawRedoAsync');
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to get all information on the current board
 *         NOTE: infomration include all draw records and base image
 *               on current board
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {String}          data.bid, the board uuid
 */
exports.getDrawBoardAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    LogUtils.info(LogCategory, {
        uid: uid,
        channelId: data.channelId,
        bid: data._bid
    }, '[' + socket.id + '] get draw board info... ');
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data._bid, 'string'),
        function(cid, bid) {
            return DrawStorage.getBoardInfoAsync(cid, bid, uid);
        }).then(function(resource) {
            if (!resource) {
                throw new Error('fail to get board infomration on storage service');
            }
            return DrawWorker.drawBaseImgAsync(resource.board, resource.reocrds);
        }).then(function(result) {
            var errMsg = 'fail to update board base image';
            return SharedUtils.checkExecuteResult(result, errMsg);
        }).catch(function(err) {
            LogUtils.warn(LogCategory, {
                reqData: data,
                error: err.toString()
            }, '[' + socket.id + '] fail on getDrawBoardAsync');
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to get specific board's uuid
 *
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {Number}          data.boardIdx, the draw board id
 */
exports.getBoardIdAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardIdx, 'number'),
        function(cid, idx) {
            return DrawStorage.getBoardIdAsync(cid, idx, uid);
        }).then(function(result) {
            var errMsg = 'fail to get board id';
            return SharedUtils.checkExecuteResult(result, errMsg);
        }).catch(function(err) {
            LogUtils.warn(LogCategory, {
                reqData: data,
                error: err.toString()
            }, '[' + socket.id + '] fail on getBoardIdAsync');
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to get latest updated draw board id
 *         NOTE: it's useful for user to navigate to this board
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 */
exports.getLatestBoardIdAsync = function(socket, data) {
    LogUtils.info(LogCategory, {
        uid: socket.getAuthToken(),
        channelId: data.channelId
    }, '[' + socket.id + '] get latest used board id... ');
    return SharedUtils.argsCheckAsync(data.channelId, 'md5')
        .then(function(cid) {
            return DrawStorage.getLatestBoardIdAsync(cid);
        }).then(function(result) {
            var errMsg = 'fail to get latest board id on stoarge service';
            return SharedUtils.checkExecuteResult(result, errMsg);
        }).catch(function(err) {
            LogUtils.warn(LogCategory, {
                reqData: data,
                error: err.toString()
            }, '[' + socket.id + '] fail on getLatestBoardIdAsync');
            throw err;
        });
};

/**
 * @Author: George_Chen
 * @Description: to publish all receivers about current draw failure
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          cid, the channel id
 * @param {String}          _bid, the board uuid
 * @param {String}          failReason, the reason for current fail
 */
function _publishDrawFail(socket, cid, _bid, failReason) {
    socket.global.publish('channel:' + cid, {
        service: 'draw',
        clientHandler: 'onSaveDrawRecord',
        socketId: socket.id,
        params: {
            channelId: cid,
            _bid: _bid,
            reason: failReason
        }
    });
}
