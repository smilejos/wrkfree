'use strict';
var Promise = require('bluebird');
var Deque = require('double-ended-queue');
var SharedUtils = require('../../../sharedUtils/utils');
var StorageManager = require('../../../storageService/storageManager');
var DrawStorage = StorageManager.getService('Draw');
var DrawWorker = require('../services/drawWorker');
var DrawUtils = require('../../../sharedUtils/drawUtils');
var LogUtils = require('../../../sharedUtils/logUtils');
var LogCategory = 'HANDLER';

var DEFAULT_TEMP_DRAWS_LENGTH = 200;

/**
 * Public API
 * @Author: George_Chen
 * @Description: for client to init his draw stream before drawing
 * 
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {Number}          data.boardId, the draw board id
 */
exports.initToDrawAsync = function(socket, data) {
    LogUtils.info(LogCategory, {
        uid: socket.getAuthToken()
    }, '[' + socket.id + '] initToDrawAsync ... ');
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        function(cid, bid) {
            var drawId = DrawUtils.getDrawViewId(cid, bid);
            data.clientId = socket.id;
            _clearTempDraws(socket, drawId);
            return true;
        }).catch(function(err) {
            LogUtils.warn(LogCategory, {
                reqData: data,
                error: err.toString()
            }, '[' + socket.id + '] fail on initToDrawAsync');
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for handling realtime drawing chunks that user published
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {Number}          data.boardId, the draw board id
 * @param {Array}           data.chunks, the raw chunks of current drawing
 */
exports.drawAsync = function(socket, data) {
    LogUtils.debug(LogCategory, {
        uid: socket.getAuthToken()
    }, '[' + socket.id + '] drawing ... ');
    return Promise.try(function(){
        var isCid = SharedUtils.isMd5Hex(data.channelId);
        var isBid = SharedUtils.isDrawBoardId(data.boardId);
        var validChunks = DrawUtils.checkDrawChunksAsync(data.chunks);
        if (!isCid || !isBid || !validChunks) {
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
 *         NOTE: user need to inform all clients that how many draw chunks
 *               that he has sent.
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {Number}          data.boardId, the draw board id
 * @param {Number}          data.chunksNum, how many chunks that drawer sent
 * @param {Object}          data.drawOptions, the draw options for this record
 */
exports.saveRecordAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    LogUtils.info(LogCategory, {
        uid: uid,
        channelId: data.channelId,
        boardId: data.boardId
    }, '[' + socket.id + '] save draw record... ');
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        SharedUtils.argsCheckAsync(data.record, 'array'),
        SharedUtils.argsCheckAsync(data.drawOptions, 'drawOptions'),
        function(cid, bid, record, drawOptions) {
            return DrawStorage.saveRecordAsync(cid, bid, record, drawOptions);
        }).then(function(result) {
            if (result === null) {
                throw new Error('save draw record fail on storage service');
            }
            // enqueue a preview image update job
            DrawWorker.setUpdateSchedule(data.channelId, data.boardId, uid);
            return result;
        }).catch(function(err) {
            LogUtils.warn(LogCategory, {
                reqData: data,
                error: err.toString()
            }, '[' + socket.id + '] fail on saveRecordAsync');
            // inform other members the latest draw saving failure
            if (data.channelId && data.boardId) {
                _publishDrawFail(socket, data.channelId, data.boardId, 'save draw fail');
            }
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to save record when drawing on the same point
 *
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {Number}          data.boardId, the draw board id
 * @param {Array}           data.chunks, the raw chunks of current drawing
 * @param {Object}          data.drawOptions, the draw options for this record
 */
exports.saveSingleDrawAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    LogUtils.info(LogCategory, {
        uid: uid,
        channelId: data.channelId,
        boardId: data.boardId
    }, '[' + socket.id + '] save single draw point record... ');
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        DrawUtils.checkDrawChunksAsync(data.chunks),
        SharedUtils.argsCheckAsync(data.drawOptions, 'drawOptions'),
        function(cid, bid, chunks, drawOptions) {
            var drawId = DrawUtils.getDrawViewId(cid, bid);
            _clearTempDraws(socket, drawId);
            return DrawStorage.saveSingleDrawAsync(cid, bid, chunks, drawOptions);
        }).then(function(result) {
            if (result === null) {
                throw new Error('fail to save single draw on storage service');
            }
            DrawWorker.setUpdateSchedule(data.channelId, data.boardId, uid);
            return result;
        }).catch(function(err) {
            LogUtils.warn(LogCategory, {
                reqData: data,
                error: err.toString()
            }, '[' + socket.id + '] fail on saveSingleDrawAsync');
            if (data.channelId && data.boardId) {
                _publishDrawFail(socket, data.channelId, data.boardId, 'save singleDraw fail');
            }
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: user can use this function to generate a clean board draw record
 *               on current board, then board will be cleaned at same time
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {Number}          data.boardId, the draw board id
 */
exports.cleanDrawBoardAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    LogUtils.info(LogCategory, {
        uid: uid,
        channelId: data.channelId,
        boardId: data.boardId
    }, '[' + socket.id + '] clean current board... ');

    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        function(cid, bid) {
            var drawId = DrawUtils.getDrawViewId(cid, bid);
            _clearTempDraws(socket, drawId);
            return DrawStorage.cleanBoardAsync(cid, bid);
        }).then(function(result) {
            if (result === null) {
                throw new Error('fail to clean drawboard');
            }
            DrawWorker.setUpdateSchedule(data.channelId, data.boardId, uid);
            return result;
        }).catch(function(err) {
            LogUtils.warn(LogCategory, {
                reqData: data,
                error: err.toString()
            }, '[' + socket.id + '] fail on cleanDrawBoardAsync');
            if (data.channelId && data.boardId) {
                _publishDrawFail(socket, data.channelId, data.boardId, 'clean board fail');
            }
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
 * @param {Number}          data.boardId, the draw board id
 */
exports.addBoardAsync = function(socket, data) {
    LogUtils.info(LogCategory, {
        uid: socket.getAuthToken(),
        channelId: data.channelId,
        boardId: data.newBoardId
    }, '[' + socket.id + '] add new drawing board... ');
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.newBoardId, 'boardId'),
        function(cid, bid) {
            var uid = socket.getAuthToken();
            return DrawStorage.addBoardAsync(cid, bid, uid);
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
 * @param {Number}          data.boardId, the draw board id
 */
exports.drawUndoAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    LogUtils.info(LogCategory, {
        uid: uid,
        channelId: data.channelId,
        boardId: data.newBoardId
    }, '[' + socket.id + '] try to undo last draw... ');
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        function(cid, bid) {
            var drawId = DrawUtils.getDrawViewId(cid, bid);
            _clearTempDraws(socket, drawId);
            return DrawStorage.undoRecordAsync(cid, bid, uid);
        }).then(function(result) {
            if (result === null) {
                throw new Error('fail to undo last draw on storage service');
            }
            DrawWorker.setUpdateSchedule(data.channelId, data.boardId, uid);
            return result;
        }).catch(function(err) {
            LogUtils.warn(LogCategory, {
                reqData: data,
                error: err.toString()
            }, '[' + socket.id + '] fail on drawUndoAsync');
            if (data.channelId && data.boardId) {
                _publishDrawFail(socket, data.channelId, data.boardId, 'draw undo fail');
            }
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
 * @param {Number}          data.boardId, the draw board id
 */
exports.drawRedoAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    LogUtils.info(LogCategory, {
        uid: uid,
        channelId: data.channelId,
        boardId: data.newBoardId
    }, '[' + socket.id + '] try to restore last undo draw... ');
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        function(cid, bid) {
            var drawId = DrawUtils.getDrawViewId(cid, bid);
            _clearTempDraws(socket, drawId);
            return DrawStorage.restoreUndoAsync(cid, bid, uid);
        }).then(function(result) {
            if (result === null) {
                throw new Error('fail to restore last undo draw on storage service');
            }
            DrawWorker.setUpdateSchedule(data.channelId, data.boardId, uid);
            return result;
        }).catch(function(err) {
            LogUtils.warn(LogCategory, {
                reqData: data,
                error: err.toString()
            }, '[' + socket.id + '] fail on drawRedoAsync');
            if (data.channelId && data.boardId) {
                _publishDrawFail(socket, data.channelId, data.boardId, 'draw redo fail');
            }
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
 * @param {Number}          data.boardId, the draw board id
 */
exports.getDrawBoardAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    LogUtils.info(LogCategory, {
        uid: uid,
        channelId: data.channelId,
        boardId: data.newBoardId
    }, '[' + socket.id + '] get draw board info... ');
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        function(cid, bid) {
            var drawId = DrawUtils.getDrawViewId(cid, bid);
            _clearTempDraws(socket, drawId);
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
            if (data.channelId && data.boardId) {
                _publishDrawFail(socket, data.channelId, data.boardId, 'get board info fail');
            }
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
 * @Description: for user to clear his temp draws on current drawingBoard
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          drawId, the drawing id
 */
function _clearTempDraws(socket, drawId) {
    if (!socket.drawTemp) {
        socket.drawTemp = {};
    }
    if (!socket.drawTemp[drawId]) {
        socket.drawTemp[drawId] = new Deque(DEFAULT_TEMP_DRAWS_LENGTH);
    } else {
        socket.drawTemp[drawId].clear();
    }
}

/**
 * @Author: George_Chen
 * @Description: to publish all receivers about current draw failure
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          cid, the channel id
 * @param {String}          cid, the board id
 * @param {String}          failReason, the reason for current fail
 */
function _publishDrawFail(socket, cid, bid, failReason) {
    socket.global.publish('channel:' + cid, {
        service: 'draw',
        clientHandler: 'onSaveDrawRecord',
        socketId: socket.id,
        params: {
            channelId: cid,
            boardId: bid,
            clientId: socket.id,
            reason: failReason
        }
    });
}
