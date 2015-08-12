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
 * @Description: for client to init his draw stream before drawing
 * 
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {Number}          data.boardId, the draw board id
 */
exports.initToDrawAsync = function(socket, data) {
    LogUtils.info(LogCategory, {
        uid: socket.getAuthToken()
    }, '[' + socket.id + '] drawing ... ');
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        function(cid, bid) {
            return DrawStorage.initDrawStreamAsync(cid, bid, socket.id);
        }).then(function(result) {
            if (result === null) {
                throw new Error('client fail to init draw on storage service');
            }
            data.clientId = socket.id;
            return result;
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
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        DrawUtils.checkDrawChunksAsync(data.chunks),
        function(cid, bid, chunks) {
            return DrawStorage.streamRecordDataAsync(cid, bid, socket.id, chunks);
        }).then(function(result) {
            if (result) {
                data.clientId = socket.id;
            }
            var errMsg = 'drawing fail on storage service';
            return SharedUtils.checkExecuteResult(result, errMsg);
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
    LogUtils.info(LogCategory, {
        uid: socket.getAuthToken(),
        channelId: data.channelId,
        boardId: data.boardId
    }, '[' + socket.id + '] save draw record... ');
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        SharedUtils.argsCheckAsync(data.chunksNum, 'number'),
        SharedUtils.argsCheckAsync(data.drawOptions, 'drawOptions'),
        function(cid, bid, chunksLength, drawOptions) {
            return DrawStorage.saveRecordAsync(cid, bid, socket.id, chunksLength, drawOptions);
        }).then(function(result) {
            if (!result) {
                throw new Error('save draw record fail on storage service');
            }
            data.clientId = socket.id;
            // enqueue a preview image update job
            var uid = socket.getAuthToken();
            DrawWorker.setUpdateSchedule(data.channelId, data.boardId, uid);
            return result;
        }).catch(function(err) {
            LogUtils.warn(LogCategory, {
                reqData: data,
                error: err.toString()
            }, '[' + socket.id + '] fail on saveRecordAsync');
            // inform other members the latest draw saving failure
            socket.global.publish('channel:' + data.channelId, {
                service: 'draw',
                clientHandler: 'onSaveDrawRecord',
                socketId: socket.id,
                params: {
                    channelId: data.channelId,
                    boardId: data.boardId,
                    clientId: socket.id
                }
            });
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
    LogUtils.info(LogCategory, {
        uid: socket.getAuthToken(),
        channelId: data.channelId,
        boardId: data.boardId
    }, '[' + socket.id + '] save single draw point record... ');
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        DrawUtils.checkDrawChunksAsync(data.chunks),
        SharedUtils.argsCheckAsync(data.drawOptions, 'drawOptions'),
        function(cid, bid, chunks, drawOptions) {
            return DrawStorage.saveSingleDrawAsync(cid, bid, socket.id, chunks, drawOptions);
        }).then(function(result) {
            if (result === null) {
                throw new Error('fail to save single draw on storage service');
            }
            return result;
        }).catch(function(err) {
            LogUtils.warn(LogCategory, {
                reqData: data,
                error: err.toString()
            }, '[' + socket.id + '] fail on saveSingleDrawAsync');
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
    LogUtils.info(LogCategory, {
        uid: socket.getAuthToken(),
        channelId: data.channelId,
        boardId: data.boardId
    }, '[' + socket.id + '] clean current board... ');
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        function(cid, bid) {
            return DrawStorage.cleanBoardAsync(cid, bid, socket.id);
        }).then(function(result) {
            if (result === null) {
                throw new Error('fail to clean drawboard');
            }
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
    LogUtils.info(LogCategory, {
        uid: socket.getAuthToken(),
        channelId: data.channelId,
        boardId: data.newBoardId
    }, '[' + socket.id + '] try to undo last draw... ');
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        function(cid, bid) {
            var uid = socket.getAuthToken();
            return DrawStorage.undoRecordAsync(cid, bid, uid);
        }).then(function(result) {
            var errMsg = 'fail to undo last draw on storage service';
            return SharedUtils.checkExecuteResult(result, errMsg);
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
 * @param {Number}          data.boardId, the draw board id
 */
exports.drawRedoAsync = function(socket, data) {
    LogUtils.info(LogCategory, {
        uid: socket.getAuthToken(),
        channelId: data.channelId,
        boardId: data.newBoardId
    }, '[' + socket.id + '] try to restore last undo draw... ');
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        function(cid, bid) {
            var uid = socket.getAuthToken();
            return DrawStorage.restoreUndoAsync(cid, bid, uid);
        }).then(function(result) {
            var errMsg = 'fail to restore last undo draw on storage service';
            return SharedUtils.checkExecuteResult(result, errMsg);
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
 * @param {Number}          data.boardId, the draw board id
 */
exports.getDrawBoardAsync = function(socket, data) {
    LogUtils.info(LogCategory, {
        uid: socket.getAuthToken(),
        channelId: data.channelId,
        boardId: data.newBoardId
    }, '[' + socket.id + '] get draw board info... ');
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        function(cid, bid) {
            var uid = socket.getAuthToken();
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
 * @Description: for user to get latest updated draw board id
 *         NOTE: it's useful for user to navigate to this board
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 */
exports.getLatestBoardIdAsync = function(socket, data) {
    LogUtils.info(LogCategory, {
        uid: socket.getAuthToken(),
        channelId: data.channelId,
        boardId: data.newBoardId
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
